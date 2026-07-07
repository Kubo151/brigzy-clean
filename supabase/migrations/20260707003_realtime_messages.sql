-- ============================================================
-- Migration 009: enable Realtime for chat
--   The supabase_realtime publication was EMPTY — postgres_changes
--   subscriptions never fired, so recipients only saw new messages
--   after a manual refresh.
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
