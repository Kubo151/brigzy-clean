-- Security fix (found by automated review of 20260712002): the RLS
-- policies "messages_sender_edit_delete" and the pre-existing
-- "Messages: receiver marks read" only gate row visibility, not which
-- columns change — Postgres RLS can't express column-level scope
-- declaratively. A sender could rewrite receiver_id, message_type, or
-- (critically) media_path on their own row, and since chat-media's
-- storage RLS grants read to either party of a message referencing a
-- given path, repointing media_path let a sender mint a signed URL for
-- an arbitrary object in the bucket. Senders could also backdate/clear
-- edited_at or clear deleted_at, undermining chat-as-dispute-evidence
-- (VOP explicitly lists chat communication as evidence).
--
-- Fix: a BEFORE UPDATE trigger forces every column outside the
-- sender's/receiver's actual allowed scope back to its OLD value, and
-- computes edited_at/deleted_at server-side instead of trusting the
-- client's values. Once deleted_at is set, no further update by the
-- sender is possible at all.

create or replace function public.enforce_message_edit_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    -- service-role / trusted server context (edge functions) — no restriction
    return NEW;
  end if;

  if auth.uid() = OLD.sender_id then
    if OLD.deleted_at is not null then
      raise exception 'cannot modify a deleted message';
    end if;

    if NEW.deleted_at is not null then
      -- soft delete: clear content/media, timestamp set here, nothing else moves
      NEW.content := '';
      NEW.media_path := null;
      NEW.deleted_at := now();
    elsif NEW.content is distinct from OLD.content then
      -- edit: only content may change, timestamp computed here
      NEW.edited_at := now();
      NEW.media_path := OLD.media_path;
    else
      NEW.edited_at := OLD.edited_at;
      NEW.media_path := OLD.media_path;
    end if;

    NEW.id := OLD.id;
    NEW.sender_id := OLD.sender_id;
    NEW.receiver_id := OLD.receiver_id;
    NEW.message_type := OLD.message_type;
    NEW.media_duration_seconds := OLD.media_duration_seconds;
    NEW.job_id := OLD.job_id;
    NEW.created_at := OLD.created_at;
    NEW.sender_user_id := OLD.sender_user_id;
    NEW.conversation_id := OLD.conversation_id;
    NEW.read := OLD.read;

  elsif auth.uid() = OLD.receiver_id then
    -- receiver may only ever flip `read` — everything else locked to OLD
    NEW.id := OLD.id;
    NEW.sender_id := OLD.sender_id;
    NEW.receiver_id := OLD.receiver_id;
    NEW.content := OLD.content;
    NEW.message_type := OLD.message_type;
    NEW.media_path := OLD.media_path;
    NEW.media_duration_seconds := OLD.media_duration_seconds;
    NEW.edited_at := OLD.edited_at;
    NEW.deleted_at := OLD.deleted_at;
    NEW.job_id := OLD.job_id;
    NEW.created_at := OLD.created_at;
    NEW.sender_user_id := OLD.sender_user_id;
    NEW.conversation_id := OLD.conversation_id;

  else
    raise exception 'not a participant of this message';
  end if;

  return NEW;
end;
$$;

drop trigger if exists messages_enforce_edit_scope on public.messages;
create trigger messages_enforce_edit_scope
  before update on public.messages
  for each row execute function public.enforce_message_edit_scope();

-- Also close the same class of gap on reactions: restrict emoji to the
-- app's own quick-reaction set rather than accepting arbitrary text.
alter table public.message_reactions drop constraint if exists message_reactions_emoji_check;
alter table public.message_reactions add constraint message_reactions_emoji_check
  check (emoji = ANY (ARRAY['👍', '❤️', '😂', '😮', '😢', '🙏']));
