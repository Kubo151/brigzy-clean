-- ============================================================
-- Migration 003: Trust / Gamification / QR / Notifications /
--                Disputes / Admin tables
-- ============================================================

-- ── 1. Alter reviews (add new columns; keep old for compat) ───
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS booking_id     uuid REFERENCES public.bookings(id),
  ADD COLUMN IF NOT EXISTS from_user_id   uuid REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS to_user_id     uuid REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS rating_overall int,
  ADD COLUMN IF NOT EXISTS rating_cat1    int,
  ADD COLUMN IF NOT EXISTS rating_cat2    int,
  ADD COLUMN IF NOT EXISTS rating_cat3    int,
  ADD COLUMN IF NOT EXISTS submitted_at   timestamptz,
  ADD COLUMN IF NOT EXISTS revealed_at    timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at     timestamptz DEFAULT now();

ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_rating_overall_check,
  DROP CONSTRAINT IF EXISTS reviews_rating_cat1_check,
  DROP CONSTRAINT IF EXISTS reviews_rating_cat2_check,
  DROP CONSTRAINT IF EXISTS reviews_rating_cat3_check;
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_rating_overall_check
    CHECK (rating_overall IS NULL OR rating_overall BETWEEN 1 AND 5),
  ADD CONSTRAINT reviews_rating_cat1_check
    CHECK (rating_cat1 IS NULL OR rating_cat1 BETWEEN 1 AND 5),
  ADD CONSTRAINT reviews_rating_cat2_check
    CHECK (rating_cat2 IS NULL OR rating_cat2 BETWEEN 1 AND 5),
  ADD CONSTRAINT reviews_rating_cat3_check
    CHECK (rating_cat3 IS NULL OR rating_cat3 BETWEEN 1 AND 5);

CREATE INDEX IF NOT EXISTS reviews_booking_idx ON public.reviews(booking_id);

-- ── 2. XP events ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.xp_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.users(id),
  delta           int  NOT NULL,
  reason          text NOT NULL,
  ref_booking_id  uuid REFERENCES public.bookings(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;

-- ── 3. Badges ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.badges (
  key        text PRIMARY KEY,
  name_i18n  jsonb NOT NULL DEFAULT '{}'
);
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges_public_read" ON public.badges FOR SELECT USING (true);

INSERT INTO public.badges (key, name_i18n) VALUES
  ('first_job',  '{"sk":"Prvá brigáda","en":"First Job"}'),
  ('reliable',   '{"sk":"Spoľahlivý","en":"Reliable"}'),
  ('five_star',  '{"sk":"Päťhviezdičkový","en":"Five Star"}'),
  ('veteran',    '{"sk":"Veterán","en":"Veteran"}'),
  ('fast_apply', '{"sk":"Rýchly uchádzač","en":"Quick Apply"}')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.user_badges (
  user_id    uuid NOT NULL REFERENCES public.users(id),
  badge_key  text NOT NULL REFERENCES public.badges(key),
  awarded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_key)
);
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- ── 4. Brigy coin ledger (internal loyalty, NON-convertible) ──
CREATE TABLE IF NOT EXISTS public.brigy_ledger (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.users(id),
  entry_type      text NOT NULL,
  delta           int  NOT NULL,
  reason          text NOT NULL,
  ref_booking_id  uuid REFERENCES public.bookings(id),
  ref_referral_id uuid, -- FK added after referrals table
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT brigy_ledger_entry_type_check
    CHECK (entry_type IN ('earn','spend','adjust'))
);
ALTER TABLE public.brigy_ledger ENABLE ROW LEVEL SECURITY;

-- ── 5. Referrals ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.referrals (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_user_id      uuid NOT NULL REFERENCES public.users(id),
  invitee_user_id      uuid REFERENCES public.users(id),
  code                 text NOT NULL UNIQUE,
  status               text NOT NULL DEFAULT 'pending',
  converted_booking_id uuid REFERENCES public.bookings(id),
  created_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT referrals_status_check CHECK (status IN ('pending','converted','blocked'))
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.brigy_ledger
  DROP CONSTRAINT IF EXISTS brigy_ledger_ref_referral_id_fkey;
ALTER TABLE public.brigy_ledger
  ADD CONSTRAINT brigy_ledger_ref_referral_id_fkey
  FOREIGN KEY (ref_referral_id) REFERENCES public.referrals(id);

-- ── 6. Verified applications (Brigzy Verified program) ────────
CREATE TABLE IF NOT EXISTS public.verified_applications (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES public.users(id),
  status           text NOT NULL DEFAULT 'pending',
  reviewed_by      uuid REFERENCES public.users(id),
  rejection_reason text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  reviewed_at      timestamptz,
  CONSTRAINT verified_applications_status_check
    CHECK (status IN ('pending','approved','rejected'))
);
ALTER TABLE public.verified_applications ENABLE ROW LEVEL SECURITY;

-- ── 7. Worker listing profiles (inzertný mód — feature flagged) ─
CREATE TABLE IF NOT EXISTS public.worker_listing_profiles (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL UNIQUE REFERENCES public.users(id),
  bio                  text,
  preferred_rate_cents int,
  skills               text[] DEFAULT '{}',
  weekly_capacity_hours int,
  is_active            bool NOT NULL DEFAULT false,
  updated_at           timestamptz DEFAULT now()
);
ALTER TABLE public.worker_listing_profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.worker_availability (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES public.users(id),
  available_from timestamptz NOT NULL,
  available_to   timestamptz NOT NULL
);
ALTER TABLE public.worker_availability ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.listing_contacts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poster_user_id  uuid NOT NULL REFERENCES public.users(id),
  worker_user_id  uuid NOT NULL REFERENCES public.users(id),
  conversation_id uuid REFERENCES public.conversations(id),
  credit_charged  bool NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.listing_contacts ENABLE ROW LEVEL SECURITY;

-- ── 8. QR nonces (ephemeral, 65s TTL) ────────────────────────
CREATE TABLE IF NOT EXISTS public.qr_nonces (
  nonce          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id     uuid NOT NULL REFERENCES public.bookings(id),
  worker_user_id uuid NOT NULL REFERENCES public.users(id),
  expires_at     timestamptz NOT NULL,
  used_at        timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.qr_nonces ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS qr_nonces_expires_at_idx ON public.qr_nonces(expires_at);

-- ── 9. Attendance events (QR check-in/out) ────────────────────
CREATE TABLE IF NOT EXISTS public.attendance_events (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id       uuid NOT NULL REFERENCES public.bookings(id),
  kind             text NOT NULL,
  scanned_by       uuid NOT NULL REFERENCES public.users(id),
  qr_nonce         uuid REFERENCES public.qr_nonces(nonce),
  device_timestamp timestamptz,
  server_timestamp timestamptz NOT NULL DEFAULT now(),
  lat              numeric,
  lng              numeric,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT attendance_events_kind_check CHECK (kind IN ('check_in','check_out'))
);
ALTER TABLE public.attendance_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS attendance_events_booking_idx ON public.attendance_events(booking_id);

-- ── 10. Work hours counters (350h DoVP limit per employer×worker×year) ─
CREATE TABLE IF NOT EXISTS public.work_hours_counters (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poster_user_id  uuid NOT NULL REFERENCES public.users(id),
  worker_user_id  uuid NOT NULL REFERENCES public.users(id),
  year            int  NOT NULL,
  seed_hours      numeric NOT NULL DEFAULT 0,
  accrued_hours   numeric NOT NULL DEFAULT 0,
  total_hours     numeric GENERATED ALWAYS AS (seed_hours + accrued_hours) STORED,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (poster_user_id, worker_user_id, year),
  CONSTRAINT work_hours_seed_check CHECK (seed_hours >= 0 AND seed_hours < 350),
  CONSTRAINT work_hours_year_check  CHECK (year >= 2020)
);
ALTER TABLE public.work_hours_counters ENABLE ROW LEVEL SECURITY;

-- ── 11. Push tokens ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.users(id),
  expo_token  text NOT NULL UNIQUE,
  platform    text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- ── 12. Notifications ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.users(id),
  type        text NOT NULL,
  title       text NOT NULL,
  body        text,
  deep_link   text,
  entity_type text,
  entity_id   uuid,
  read_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON public.notifications(user_id) WHERE read_at IS NULL;

-- ── 13. Disputes ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.disputes (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id           uuid NOT NULL REFERENCES public.bookings(id),
  raised_by            uuid NOT NULL REFERENCES public.users(id),
  raised_against       uuid NOT NULL REFERENCES public.users(id),
  category             text NOT NULL,
  description          text,
  evidence_urls        text[] DEFAULT '{}',
  status               text NOT NULL DEFAULT 'open',
  resolution_split_pct int,
  resolution_note      text,
  support_agent_id     uuid REFERENCES public.users(id),
  created_at           timestamptz NOT NULL DEFAULT now(),
  resolved_at          timestamptz,
  CONSTRAINT disputes_status_check CHECK (status IN (
    'open','info_requested',
    'resolved_worker','resolved_poster','resolved_split','resolved_no_action'
  )),
  CONSTRAINT disputes_split_pct_check CHECK (
    resolution_split_pct IS NULL OR
    (resolution_split_pct >= 0 AND resolution_split_pct <= 100)
  )
);
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.dispute_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id      uuid NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
  sender_user_id  uuid REFERENCES public.users(id),
  content         text NOT NULL,
  attachment_urls text[] DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.dispute_messages ENABLE ROW LEVEL SECURITY;

-- ── 14. Support conversations (S11 — one per user) ────────────
CREATE TABLE IF NOT EXISTS public.support_conversations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL UNIQUE REFERENCES public.users(id),
  dispute_id  uuid REFERENCES public.disputes(id),
  status      text NOT NULL DEFAULT 'open',
  created_at  timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  CONSTRAINT support_conversations_status_check
    CHECK (status IN ('open','resolved','closed'))
);
ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.support_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.support_conversations(id) ON DELETE CASCADE,
  sender_user_id  uuid REFERENCES public.users(id),
  sender_type     text NOT NULL DEFAULT 'user',
  content         text NOT NULL,
  attachment_urls text[] DEFAULT '{}',
  read_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT support_messages_sender_type_check
    CHECK (sender_type IN ('user','agent','system'))
);
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- ── 15. Feature flags ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.feature_flags (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL DEFAULT 'false',
  description text,
  updated_by  uuid REFERENCES public.users(id),
  updated_at  timestamptz DEFAULT now()
);
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

INSERT INTO public.feature_flags (key, value, description) VALUES
  ('brigzy_verified_enabled', 'false', 'Brigzy Verified inzertný mód (B5.4) — launch later'),
  ('insurance_enabled',       'false', 'FinExpert/Universal insurance (S9) — čaká licence C-5'),
  ('stripe_live_mode',        'false', 'Live Stripe mode — čaká legal sign-off'),
  ('price_negotiation',       'true',  'S2 price negotiation flow'),
  ('contract_addendum',       'true',  'S4 Dodatok — extra work addendum')
ON CONFLICT (key) DO NOTHING;

-- ── 16. Broadcast log ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.broadcast_log (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_by          uuid REFERENCES public.users(id),
  segment          text,
  title            text NOT NULL,
  body             text NOT NULL,
  recipient_count  int  NOT NULL DEFAULT 0,
  sent_at          timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.broadcast_log ENABLE ROW LEVEL SECURITY;

-- ── 17. Admin actions audit log ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id  uuid NOT NULL REFERENCES public.users(id),
  action         text NOT NULL,
  entity_type    text,
  entity_id      uuid,
  payload_json   jsonb DEFAULT '{}',
  created_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS admin_actions_created_at_idx ON public.admin_actions(created_at DESC);
