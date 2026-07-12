-- S2 price negotiation: price_negotiations already has its RLS select
-- policy (participants of the underlying application/job) from the core
-- schema migration — just needs to join the realtime publication like
-- every other RLS-readable table (migration 010).
alter publication supabase_realtime add table public.price_negotiations;
