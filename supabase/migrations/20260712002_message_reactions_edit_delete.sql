-- Instagram/WhatsApp-style chat: reactions, edit, soft-delete.

alter table public.messages
  add column if not exists edited_at timestamptz,
  add column if not exists deleted_at timestamptz;

-- Sender can update their own message (edit content, or soft-delete by
-- setting deleted_at + clearing content/media_path). Row-level only —
-- Postgres RLS can't restrict *which* columns change without a trigger,
-- same limitation the pre-existing "receiver marks read" policy has.
create policy "messages_sender_edit_delete"
  on public.messages for update
  using (auth.uid() = sender_id)
  with check (auth.uid() = sender_id);

create table public.message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (message_id, user_id)
);

alter table public.message_reactions enable row level security;

create policy "message_reactions_select_participant"
  on public.message_reactions for select
  using (exists (
    select 1 from public.messages m
    where m.id = message_reactions.message_id
      and (m.sender_id = auth.uid() or m.receiver_id = auth.uid())
  ));

create policy "message_reactions_insert_own"
  on public.message_reactions for insert
  with check (
    user_id = auth.uid() and exists (
      select 1 from public.messages m
      where m.id = message_reactions.message_id
        and (m.sender_id = auth.uid() or m.receiver_id = auth.uid())
    )
  );

create policy "message_reactions_update_own"
  on public.message_reactions for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "message_reactions_delete_own"
  on public.message_reactions for delete
  using (user_id = auth.uid());

alter publication supabase_realtime add table public.message_reactions;
