-- ============================================================
-- Migration 002: Money + Contracts + Comms
--   - Drop old wallets/transactions
--   - escrow_transactions, wallet_ledger, payouts
--   - contracts, contract_otp_events, contract_addendums
--   - price_negotiations
--   - conversations, conversation_participants
--   - alter messages (add new columns)
-- ============================================================

-- ── 1. Drop old money tables (replaced by new schema) ─────────
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.wallets      CASCADE;

-- ── 2. Escrow transactions ────────────────────────────────────
-- Service-role only (Edge Functions). RLS: no user policies = all blocked.
CREATE TABLE IF NOT EXISTS public.escrow_transactions (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id               uuid NOT NULL REFERENCES public.bookings(id),
  stripe_payment_intent_id text,
  amount_cents             int  NOT NULL,
  currency                 char(3) NOT NULL DEFAULT 'EUR',
  service_fee_cents        int  NOT NULL DEFAULT 0,
  state                    text NOT NULL DEFAULT 'created',
  held_at                  timestamptz,
  released_at              timestamptz,
  released_amount_cents    int,
  created_at               timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT escrow_state_check CHECK (state IN ('created','pending','cleared','disputed','refunded'))
);
ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;
-- No user policies → service_role only

-- Back-fill FK on bookings
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_escrow_id_fkey;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_escrow_id_fkey
  FOREIGN KEY (escrow_id) REFERENCES public.escrow_transactions(id);

-- ── 3. Wallet ledger (append-only) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.wallet_ledger (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.users(id),
  entry_type      text NOT NULL,
  amount_cents    int  NOT NULL,
  currency        char(3) NOT NULL DEFAULT 'EUR',
  ref_booking_id  uuid REFERENCES public.bookings(id),
  ref_payout_id   uuid, -- FK added after payouts table
  description     text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wallet_ledger_entry_type_check
    CHECK (entry_type IN ('credit','debit','payout','fee','adjustment'))
);
ALTER TABLE public.wallet_ledger ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS wallet_ledger_user_idx ON public.wallet_ledger(user_id);

-- ── 4. Payouts ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payouts (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES public.users(id),
  amount_cents       int  NOT NULL,
  currency           char(3) NOT NULL DEFAULT 'EUR',
  stripe_transfer_id text,
  stripe_payout_id   text,
  status             text NOT NULL DEFAULT 'requested',
  created_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payouts_status_check
    CHECK (status IN ('requested','processing','paid','failed'))
);
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Add payout FK to wallet_ledger now that payouts exists
ALTER TABLE public.wallet_ledger
  DROP CONSTRAINT IF EXISTS wallet_ledger_ref_payout_id_fkey;
ALTER TABLE public.wallet_ledger
  ADD CONSTRAINT wallet_ledger_ref_payout_id_fkey
  FOREIGN KEY (ref_payout_id) REFERENCES public.payouts(id);

-- ── 5. Contracts ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contracts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id          uuid NOT NULL REFERENCES public.bookings(id),
  type                text NOT NULL,
  rendered_url        text,
  payload_json        jsonb NOT NULL DEFAULT '{}',
  esign_level         text  DEFAULT 'ades',
  audit_log_json      jsonb NOT NULL DEFAULT '[]',
  signed_by_worker_at timestamptz,
  signed_by_poster_at timestamptz,
  worker_sign_method  text,
  poster_sign_method  text,
  bok_scan_url        text,
  status              text NOT NULL DEFAULT 'draft',
  template_version    text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contracts_type_check
    CHECK (type IN ('dovp','dopc','zmluva_o_dielo')),
  CONSTRAINT contracts_status_check
    CHECK (status IN ('draft','pending_signatures','signed')),
  CONSTRAINT contracts_worker_sign_method_check
    CHECK (worker_sign_method IS NULL OR worker_sign_method IN ('otp','bok')),
  CONSTRAINT contracts_poster_sign_method_check
    CHECK (poster_sign_method IS NULL OR poster_sign_method IN ('otp','bok'))
);
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Back-fill FK on bookings
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_contract_id_fkey;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_contract_id_fkey
  FOREIGN KEY (contract_id) REFERENCES public.contracts(id);

-- ── 6. Contract OTP events (AdES audit trail) ─────────────────
CREATE TABLE IF NOT EXISTS public.contract_otp_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id),
  user_id     uuid NOT NULL REFERENCES public.users(id),
  phone_last4 char(4),
  sent_at     timestamptz,
  verified_at timestamptz,
  ip_hash     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.contract_otp_events ENABLE ROW LEVEL SECURITY;

-- ── 7. Contract addendums (Dodatok) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.contract_addendums (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id         uuid NOT NULL REFERENCES public.contracts(id),
  booking_id          uuid NOT NULL REFERENCES public.bookings(id),
  seq                 int  NOT NULL DEFAULT 1,
  description         text,
  extra_amount_cents  int  NOT NULL,
  currency            char(3) NOT NULL DEFAULT 'EUR',
  rendered_url        text,
  payload_json        jsonb NOT NULL DEFAULT '{}',
  audit_log_json      jsonb NOT NULL DEFAULT '[]',
  signed_by_worker_at timestamptz,
  signed_by_poster_at timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.contract_addendums ENABLE ROW LEVEL SECURITY;

-- ── 8. Price negotiations (S2 — keyed to application) ─────────
CREATE TABLE IF NOT EXISTS public.price_negotiations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id),
  round          int  NOT NULL DEFAULT 1,
  proposed_by    text NOT NULL,
  rate_cents     int  NOT NULL,
  rate_type      text NOT NULL DEFAULT 'hourly',
  note           text,
  currency       char(3) NOT NULL DEFAULT 'EUR',
  status         text NOT NULL DEFAULT 'pending',
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT price_negotiations_round_check CHECK (round BETWEEN 1 AND 3),
  CONSTRAINT price_negotiations_proposed_by_check CHECK (proposed_by IN ('worker','poster')),
  CONSTRAINT price_negotiations_rate_type_check   CHECK (rate_type IN ('hourly','fixed')),
  CONSTRAINT price_negotiations_status_check
    CHECK (status IN ('pending','accepted','rejected','expired'))
);
ALTER TABLE public.price_negotiations ENABLE ROW LEVEL SECURITY;

-- ── 9. Conversations ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.conversations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id     uuid REFERENCES public.jobs(id),
  booking_id uuid REFERENCES public.bookings(id),
  type       text NOT NULL DEFAULT 'direct',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conversations_type_check CHECK (type IN ('direct','group'))
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- ── 10. Conversation participants ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES public.users(id),
  unread_count    int  NOT NULL DEFAULT 0,
  archived_at     timestamptz,
  PRIMARY KEY (conversation_id, user_id)
);
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- ── 11. Alter messages (add new columns; keep old for compat) ──
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES public.conversations(id),
  ADD COLUMN IF NOT EXISTS sender_user_id  uuid REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS message_type    text NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS updated_at      timestamptz DEFAULT now();

ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_message_type_check;
ALTER TABLE public.messages
  ADD CONSTRAINT messages_message_type_check
  CHECK (message_type IN ('text','system'));

CREATE INDEX IF NOT EXISTS messages_conversation_idx ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx   ON public.messages(created_at DESC);
