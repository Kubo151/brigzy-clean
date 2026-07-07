-- ============================================================
-- Migration 010: Realtime for everything the app can subscribe to.
--   Realtime delivery is still gated by each table's RLS SELECT
--   policies, so publishing is safe. Deliberately NOT added:
--   escrow_transactions / *_otp_events / admin tables — they have
--   no user-level SELECT policies, so no client could ever receive
--   their events anyway.
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contracts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_ledger;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
