-- Chat photo/voice attachments (W-chat media). Messages gain an optional
-- media_path (Supabase Storage object path, not a public URL — the bucket
-- is private) + media_duration_seconds for voice notes. message_type gains
-- 'image' and 'audio'.

alter table public.messages
  add column if not exists media_path text,
  add column if not exists media_duration_seconds integer;

alter table public.messages drop constraint if exists messages_message_type_check;
alter table public.messages add constraint messages_message_type_check
  check (message_type = ANY (ARRAY['text'::text, 'system'::text, 'image'::text, 'audio'::text]));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-media', 'chat-media', false, 15728640, array[
  'image/jpeg', 'image/png', 'image/webp', 'image/heic',
  'audio/m4a', 'audio/mp4', 'audio/aac', 'audio/webm', 'audio/wav'
])
on conflict (id) do nothing;

-- Only the uploader can write into their own folder ({uid}/...).
create policy "chat_media_own_folder_write"
  on storage.objects for insert
  with check (bucket_id = 'chat-media' and (storage.foldername(name))[1] = auth.uid()::text);

-- Readable by: the uploader (own folder, e.g. right after upload before the
-- message row exists) OR either participant of a message that references
-- this exact object path.
create policy "chat_media_read_participants"
  on storage.objects for select
  using (
    bucket_id = 'chat-media' and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.messages m
        where m.media_path = storage.objects.name
          and (m.sender_id = auth.uid() or m.receiver_id = auth.uid()
               or m.sender_user_id = auth.uid())
      )
    )
  );
