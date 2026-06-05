---
title: Data Model — Brigzy.sk MVP
type: architecture
status: draft
updated: 2026-06-02
---

# Data Model — Brigzy.sk (initial)

Postgres (Supabase). **Money = integer minor units (cents) + ISO currency** (never
floats). All tables get `id uuid pk default gen_random_uuid()`, `created_at`,
`updated_at`. RLS on every table. Legal-dependent fields flagged.

> Convention: `*_amount_cents int`, `currency char(3) default 'EUR'`, timestamps `timestamptz`.

## Identity & roles

### users  *(extends existing profile table — it's named `users`, not `profiles`)*
`id` (=auth.users.id) · `email` · `first_name` · `last_name` · `dob` · `address` · `phone` ·
`avatar_url` · `locale` (default 'sk') · `active_role` (worker|poster) ·
`stripe_account_id` (Connect, nullable) · `kyc_status` (none|pending|verified — **real via
Stripe**, ADR-0004) · `xp int default 0` · `rank_tier` · `rating_avg numeric` ·
`rating_count int` · `created_at`
> **No `rodne_cislo` here.** Registration needs only name/surname/DOB/address. rodné číslo
> is collected later, on the contract (see `contracts`). KYC docs live in Stripe, not our DB.

### companies  *(B2B poster; one user can own one for MVP, multi-manager = Future)*
`id` · `owner_user_id → users` · `name` · `ico` · `dic` · `ic_dph` (nullable) ·
`billing_address` · `created_at`   *(legal/invoicing C-8)*

## Jobs & matching

### jobs
`id` · `poster_user_id → users` · `company_id → companies` (null for C2C) ·
`title` · `description` · `category_key` (fk → categories) · `location_text` ·
`lat numeric` · `lng numeric` · `pay_type` (hourly|fixed) · `pay_amount_cents` ·
`currency` · `duration_text` · `slots_total int default 1` · `slots_filled int default 0` ·
`is_sos bool default false` · `requires_introduction bool` ·
`status` (active|filled|closed|cancelled) · `starts_at` · `ends_at` · `created_at`

### categories  *(reference; i18n via translations, not hardcoded labels)*
`key` (pk, e.g. 'hospitality') · `icon` · `sort`  → labels live in app i18n.

### applications
`id` · `job_id → jobs` · `worker_user_id → users` · `status` (pending|accepted|rejected|withdrawn) ·
`message` · `created_at`   *(unique (job_id, worker_user_id))*

## The booking (confirmed match — central object)

### bookings
`id` · `job_id → jobs` · `worker_user_id → users` · `poster_user_id → users` ·
`agreed_amount_cents` · `currency` · `service_fee_cents` ·
`status` (draft|awaiting_signatures|escrow_pending|in_progress|completed|cleared|disputed|cancelled) ·
`contract_id → contracts` · `escrow_id → escrow_transactions` ·
`check_in_at` · `check_out_at` (QR = V2) · `created_at`
> One booking per accepted worker (multi-slot job → multiple bookings).

## Money

### escrow_transactions
`id` · `booking_id → bookings` · `stripe_payment_intent_id` ·
`amount_cents` · `currency` · `service_fee_cents` ·
`state` (created|pending|cleared|disputed|refunded) · `held_at` · `released_at` ·
`released_amount_cents` *(**gross/net split PROVISIONAL — C-1**)* · `created_at`

### wallet_ledger  *(append-only; balance = sum of entries per user)*
`id` · `user_id → users` · `entry_type` (credit|debit|payout|fee|adjustment) ·
`amount_cents` (signed) · `currency` · `ref_booking_id` · `ref_payout_id` ·
`description` · `created_at`
> Available balance is derived, not stored. Holding balances may need a licence (**C-2**).

### payouts
`id` · `user_id → users` · `amount_cents` (min 1500 = €15 pooling) · `currency` ·
`stripe_transfer_id` · `stripe_payout_id` · `status` (requested|processing|paid|failed) · `created_at`

## Trust

### contracts
`id` · `booking_id` · `type` (**dovp | dopc | zmluva_o_dielo** — auto-selected by
poster×task, [[ADR-0005-employment-contract-model]]) · `rendered_url` (Storage) ·
`payload_json` (fields used) · `esign_level` (e.g. `ades`) · `audit_log_json`
(timestamp, IP, doc version, OTP ref) · `signed_by_worker_at` · `signed_by_poster_at` ·
`created_at`
> **rodné číslo** is captured **only here, at DoVP/DoPČ creation** — never on the `users`
> row at registration (GDPR minimization, C-4). Store encrypted; never expose/publish.
> Retention: payroll/accounting 10y; mzdový list 50y (mostly the zadávateľ's duty).

### reviews  *(blind: hidden until both submitted)*
`id` · `booking_id` · `from_user_id` · `to_user_id` · `rating int (1..5)` ·
`comment` · `is_visible bool default false` · `created_at`
> When both reviews for a booking exist → flip both `is_visible = true`.

### xp_events  ·  ### badges / user_badges
`xp_events`: `user_id` · `delta int` · `reason` · `ref_booking_id` · `created_at`.
`badges`: `key` · `name_i18n`. `user_badges`: `user_id` · `badge_key` · `awarded_at`.

## Comms

### conversations · messages  *(extend existing `messages`)*
`conversations`: `id` · `job_id` · `is_group bool` (multi-slot = V2) · `created_at`.
`messages`: `id` · `conversation_id` · `sender_user_id` · `text` · `read bool` · `created_at`.

### price_proposals  *(in-chat negotiation, 2.5 of spec)*
`id` · `conversation_id` · `proposed_by_user_id` · `amount_cents` · `currency` ·
`status` (open|accepted|rejected|superseded) · `created_at`
> Accepting an open proposal updates the booking's agreed amount → triggers escrow recompute.

## Notifications

### push_tokens
`id` · `user_id` · `expo_token` · `platform` · `created_at` (unique token).

### notifications
`id` · `user_id` · `type` · `title` · `body` · `data_json` · `read bool` · `created_at`.

## Disputes (MVP = minimal)

### disputes
`id` · `booking_id` · `opened_by_user_id` · `reason` · `status` (open|resolved_release|resolved_refund|cancelled) ·
`resolution_note` · `created_at`
> Opening a dispute sets `escrow_transactions.state='disputed'` (funds frozen).

## Deferred to V2/Future (not in MVP schema)
multi-manager company users · QR check-in tokens · referral codes + anti-fraud
signals (device_id, bank/phone hashes) · ads inventory · premium subscriptions ·
insurance claims · accounting export jobs.

## RLS principles
- A user reads/writes only their own rows (worker sees own applications/bookings/ledger).
- Posters manage their own jobs + see applicants to those jobs.
- Money tables (`escrow_transactions`, `wallet_ledger`, `payouts`) are **service-role
  only** — mutated solely by Edge Functions, never directly by the client.
