-- ============================================================
-- Migration 001: Core schema — categories, companies,
--                alter users/jobs/applications, create bookings
-- ============================================================

-- ── 1. Categories (reference, i18n labels in app) ────────────
CREATE TABLE IF NOT EXISTS public.categories (
  key  text PRIMARY KEY,
  icon text NOT NULL DEFAULT '⚡',
  sort int  NOT NULL DEFAULT 0
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_public_read" ON public.categories
  FOR SELECT USING (true);

INSERT INTO public.categories (key, icon, sort) VALUES
  ('hospitality', '🍽️', 1),
  ('warehouse',   '📦', 2),
  ('retail',      '🛍️', 3),
  ('events',      '🎪', 4),
  ('cleaning',    '🧹', 5),
  ('admin',       '💼', 6),
  ('delivery',    '🚚', 7),
  ('construction','🔨', 8),
  ('other',       '⚡', 9)
ON CONFLICT (key) DO NOTHING;

-- ── 2. Companies (B2B poster — one per owner for MVP) ─────────
CREATE TABLE IF NOT EXISTS public.companies (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id  uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name           text NOT NULL,
  ico            text,
  dic            text,
  ic_dph         text,
  billing_address text,
  created_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- ── 3. Alter users ────────────────────────────────────────────
-- Add new columns alongside old ones (old code still works)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS first_name      text,
  ADD COLUMN IF NOT EXISTS last_name       text,
  ADD COLUMN IF NOT EXISTS dob             date,
  ADD COLUMN IF NOT EXISTS address         text,
  ADD COLUMN IF NOT EXISTS locale          char(5)     NOT NULL DEFAULT 'sk',
  ADD COLUMN IF NOT EXISTS active_role     text        NOT NULL DEFAULT 'worker',
  ADD COLUMN IF NOT EXISTS kyc_status      text        NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS xp              int         NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rank_tier       text,
  ADD COLUMN IF NOT EXISTS rating_avg      numeric     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_count    int         NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_admin        bool        NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS frozen_at       timestamptz,
  ADD COLUMN IF NOT EXISTS dispute_strikes int         NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS brigzy_verified bool        NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at     timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at      timestamptz DEFAULT now();

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_active_role_check,
  DROP CONSTRAINT IF EXISTS users_kyc_status_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_active_role_check  CHECK (active_role IN ('worker','poster')),
  ADD CONSTRAINT users_kyc_status_check   CHECK (kyc_status  IN ('none','pending','verified'));

-- Backfill first_name/last_name from existing name/surname columns
UPDATE public.users
SET first_name = COALESCE(name, ''),
    last_name  = COALESCE(surname, ''),
    rating_avg = COALESCE(rating, 0)
WHERE first_name IS NULL;

-- ── 4. Alter jobs ─────────────────────────────────────────────
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS poster_user_id uuid        REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS company_id     uuid        REFERENCES public.companies(id),
  ADD COLUMN IF NOT EXISTS category_key   text        REFERENCES public.categories(key),
  ADD COLUMN IF NOT EXISTS location_text  text,
  ADD COLUMN IF NOT EXISTS pay_amount_cents int,
  ADD COLUMN IF NOT EXISTS currency       char(3)     NOT NULL DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS duration_text  text,
  ADD COLUMN IF NOT EXISTS slots_total    int         NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS slots_filled   int         NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_sos         bool        NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lat            numeric,
  ADD COLUMN IF NOT EXISTS lng            numeric,
  ADD COLUMN IF NOT EXISTS starts_at      timestamptz,
  ADD COLUMN IF NOT EXISTS ends_at        timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at     timestamptz DEFAULT now();

-- Fix status check: add 'filled' and 'cancelled' values
DO $$
DECLARE v_con text;
BEGIN
  SELECT conname INTO v_con
  FROM pg_constraint
  WHERE conrelid = 'public.jobs'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%status%';
  IF v_con IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.jobs DROP CONSTRAINT ' || quote_ident(v_con);
  END IF;
END $$;
ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_status_check
  CHECK (status = ANY (ARRAY['active','filled','closed','cancelled','draft']));

-- Backfill new columns from old ones
UPDATE public.jobs SET
  poster_user_id  = employer_id,
  location_text   = location,
  pay_amount_cents = ROUND(COALESCE(pay_amount, 0) * 100)::int,
  duration_text   = duration,
  is_sos          = COALESCE(is_urgent, false)
WHERE poster_user_id IS NULL;

-- ── 5. Alter applications ─────────────────────────────────────
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS worker_user_id       uuid REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS negotiated_rate_cents int,
  ADD COLUMN IF NOT EXISTS updated_at           timestamptz DEFAULT now();

-- Fix status: add 'withdrawn' value
DO $$
DECLARE v_con text;
BEGIN
  SELECT conname INTO v_con
  FROM pg_constraint
  WHERE conrelid = 'public.applications'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%status%';
  IF v_con IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.applications DROP CONSTRAINT ' || quote_ident(v_con);
  END IF;
END $$;
ALTER TABLE public.applications
  ADD CONSTRAINT applications_status_check
  CHECK (status = ANY (ARRAY['pending','accepted','rejected','withdrawn','completed']));

-- Backfill worker_user_id from old worker_id
UPDATE public.applications SET worker_user_id = worker_id WHERE worker_user_id IS NULL;

-- Unique constraint (job_id, worker_user_id) — only if no duplicates in existing data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.applications
    WHERE worker_user_id IS NOT NULL
    GROUP BY job_id, worker_user_id HAVING COUNT(*) > 1
  ) THEN
    ALTER TABLE public.applications
      ADD CONSTRAINT IF NOT EXISTS applications_job_worker_unique
      UNIQUE (job_id, worker_user_id);
  END IF;
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- ── 6. Bookings (central object) ──────────────────────────────
-- Note: contract_id and escrow_id FKs added after those tables exist (migration 002)
CREATE TABLE IF NOT EXISTS public.bookings (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id           uuid NOT NULL REFERENCES public.jobs(id),
  worker_user_id   uuid NOT NULL REFERENCES public.users(id),
  poster_user_id   uuid NOT NULL REFERENCES public.users(id),
  agreed_amount_cents int  NOT NULL,
  currency         char(3) NOT NULL DEFAULT 'EUR',
  service_fee_cents int    NOT NULL DEFAULT 0,
  status           text    NOT NULL DEFAULT 'draft',
  contract_id      uuid,   -- FK: bookings_contract_id_fkey added in migration 002
  escrow_id        uuid,   -- FK: bookings_escrow_id_fkey    added in migration 002
  check_in_at      timestamptz,
  check_out_at     timestamptz,
  parent_booking_id uuid   REFERENCES public.bookings(id),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),
  CONSTRAINT bookings_status_check CHECK (status IN (
    'draft','escrow_pending','awaiting_signatures',
    'in_progress','completed','cleared','disputed','cancelled'
  ))
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS bookings_worker_idx ON public.bookings(worker_user_id);
CREATE INDEX IF NOT EXISTS bookings_poster_idx ON public.bookings(poster_user_id);
CREATE INDEX IF NOT EXISTS bookings_job_idx    ON public.bookings(job_id);
