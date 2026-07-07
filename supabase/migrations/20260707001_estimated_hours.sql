-- ============================================================
-- Migration 007: jobs.estimated_hours
--   Planned hours for hourly jobs — escrow amount = rate × hours.
--   Backfilled from starts_at/ends_at where those exist.
-- ============================================================

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS estimated_hours numeric;

UPDATE public.jobs
SET estimated_hours = ROUND(EXTRACT(EPOCH FROM (ends_at - starts_at)) / 3600.0, 2)
WHERE estimated_hours IS NULL
  AND starts_at IS NOT NULL
  AND ends_at IS NOT NULL
  AND ends_at > starts_at;
