-- ============================================================
-- Migration 012: P2 wizard support
--   task_nature (Výsledok/Činnosť) is the signal that derives DoVP vs
--   DoPČ for B2B posters; visibility is the public/invite-only toggle.
--   companies table already exists (ico/dic/ic_dph) — no change needed there.
-- ============================================================

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS task_nature text,
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public';

ALTER TABLE public.jobs
  DROP CONSTRAINT IF EXISTS jobs_task_nature_check;
ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_task_nature_check CHECK (task_nature IS NULL OR task_nature IN ('result', 'activity'));

ALTER TABLE public.jobs
  DROP CONSTRAINT IF EXISTS jobs_visibility_check;
ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_visibility_check CHECK (visibility IN ('public', 'invite_only'));
