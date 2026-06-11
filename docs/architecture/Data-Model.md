---
title: Data Model — Brigzy.sk
type: architecture
status: draft (reconciled to v2.7 + UX-Spec B4/B5/Part C — 2026-06-12)
updated: 2026-06-12
---

# Data Model — Brigzy.sk (initial)

Postgres (Supabase). **Money = integer minor units (cents) + ISO currency** (never
floats). All tables get `id uuid pk default gen_random_uuid()`, `created_at`,
`updated_at`. RLS on every table. Legal-dependent fields flagged.

> **Reconciled to [[Brigzy-Spec-v2.7]] (2026-06-07).** v2.7 promotes several things from
> "deferred" into the core model: the **350h counter** (`work_hours_counters`), **QR check-in**
> (`attendance_events`), **contract addendums / Dodatok** (`contract_addendums`), **cross-sell**
> (`bookings.parent_booking_id`), and spec's the **Brigy coin ledger** (`brigy_ledger`) and
> **referrals**. New tables are grouped under *“v2.7 additions”* below.

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
`status` (draft|**escrow_pending|awaiting_signatures**|in_progress|completed|cleared|disputed|cancelled —
poradie **fund → sign**, fixed 2026-06-11 per [[Spec-Audit-2026-06-11]]) ·
`contract_id → contracts` · `escrow_id → escrow_transactions` ·
`check_in_at` · `check_out_at` (set from `attendance_events`) ·
`parent_booking_id → bookings` (null; set for **cross-sell** repeat hires, v2.7 §9.5) ·
`created_at`
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
`worker_sign_method` (otp|bok) · `poster_sign_method` (otp|bok) · `bok_scan_url?`
(BOK = fallback only, when OTP fails — UX-Spec S3) ·
`status` (draft|pending_signatures|signed) · `template_version` · `created_at`

### contract_otp_events  *(AdES audit trail — UX-Spec S3)*
`id` · `contract_id` · `user_id` · `phone_last4` · `sent_at` · `verified_at` · `ip_hash` · `created_at`
> **rodné číslo** is captured **only here, at DoVP/DoPČ creation** — never on the `users`
> row at registration (GDPR minimization, C-4). Store encrypted; never expose/publish.
> Retention: payroll/accounting 10y; mzdový list 50y (mostly the zadávateľ's duty).
> **SP/ZP payload (v2.7 §4):** the Brigzy KYC form at DoVP also collects **health insurer**
> (`health_insurer`: vszp|dovera|union), **permanent address**, and **IBAN** — keep these in
> `payload_json` (encrypted) so the one-click RLFO/SP/ZP XML can be generated for the firm.

### reviews  *(blind: hidden until both submitted — reconciled to UX-Spec S7, 2026-06-12)*
`id` · `booking_id` · `from_user_id` · `to_user_id` · `rating_overall int (1..5)` ·
`rating_cat1 int?` · `rating_cat2 int?` · `rating_cat3 int?` *(role-dependent categories:
worker→poster = komunikácia/férové podmienky/odporúčam; poster→worker =
dochvíľnosť/kvalita/spoľahlivosť)* · `comment (max 300)` ·
`submitted_at` · `revealed_at` (set on both submitted → both become visible) · `created_at`
> Visibility = `revealed_at IS NOT NULL` (replaces `is_visible`). **14-day window** from
> escrow release; unexpired unsubmitted → booking `review_expired`, neutral (no rating hit).
> +20 XP per submitted review. Disputes block reviewing until resolved.

### xp_events  ·  ### badges / user_badges
`xp_events`: `user_id` · `delta int` · `reason` · `ref_booking_id` · `created_at`.
`badges`: `key` · `name_i18n`. `user_badges`: `user_id` · `badge_key` · `awarded_at`.

## Comms

### conversations · conversation_participants · messages  *(reconciled to UX-Spec S1, 2026-06-12)*
`conversations`: `id` · `job_id` · `booking_id` (null pre-booking) · `type` (direct|group) · `created_at`.
> **Group chat is CORE** (v2.7 §9.3 + P3 multi-slot), not V2 — superseded the old `is_group`/V2 note.

`conversation_participants`: `conversation_id` · `user_id` · `unread_count int` · `archived_at`.
`messages`: `id` · `conversation_id` · `sender_user_id` (**null = system message**) ·
`message_type` (text|system) · `text` · `created_at`.
> System messages (applied / signed / escrow funded / dodatok / completed) are rows with
> `sender_user_id = null` — rendered distinctly, not from a user. Read state lives on
> `conversation_participants.unread_count`, not per-message.

### price_negotiations  *(replaces `price_proposals` — reconciled to UX-Spec S2, 2026-06-12)*
`id` · `application_id → applications` · `round int (1..3)` · `proposed_by` (worker|poster) ·
`rate_cents` · `rate_type` (hourly|fixed) · `note` · `currency` ·
`status` (pending|accepted|rejected|expired) · `created_at`
> Keyed to the **application** (negotiation happens after apply, before signing — DECISION-S2a),
> not the conversation. Max 3 rounds; 24h expiry on no response. Accepted →
> `applications.negotiated_rate_cents` (denormalized) → escrow recompute if already funded.

## Notifications

### push_tokens
`id` · `user_id` · `expo_token` · `platform` · `created_at` (unique token).

### notifications  *(reconciled to UX-Spec S10, 2026-06-12)*
`id` · `user_id` · `type` (enum — see S10 table) · `title` · `body` · `deep_link` ·
`entity_type` · `entity_id` · `read_at timestamptz?` (null = unread) · `created_at`.
> 90-day retention, then auto-delete. Per-type push toggles live client-side (S12).

## Disputes  *(expanded to UX-Spec S8, 2026-06-12)*

### disputes
`id` · `booking_id` · `raised_by → users` · `raised_against → users` ·
`category` (worker-side: nebezpečné podmienky|popis nesedel|obťažovanie|neuhradený dodatok|iné;
poster-side: no_show|meškanie|nekvalitná práca|škoda|podvod|iné) ·
`description` · `evidence_urls text[]` ·
`status` (open|info_requested|resolved_worker|resolved_poster|resolved_split|resolved_no_action) ·
`resolution_split_pct int?` (0–100, worker share for splits) · `resolution_note` ·
`support_agent_id → users` · `created_at` · `resolved_at`
> Opening a dispute sets `escrow_transactions.state='disputed'` (funds frozen immediately)
> + `bookings.status='disputed'`; blocks S7 reviews until resolved. Auto-evidence attached
> for support: contract PDF, attendance_events, last 50 chat messages, escrow history.

### dispute_messages  *(async party↔support communication, linked to S11)*
`id` · `dispute_id` · `sender_user_id` · `content` · `attachment_urls text[]` · `created_at`

> `users.dispute_strikes int default 0` — confirmed-violation counter; 3 → manual account
> review flag (no auto-ban in MVP).

## v2.7 additions

### contract_addendums  *(Dodatok — extra work on an active booking, v2.7 §3.3/§9.5)*
`id` · `contract_id → contracts` · `booking_id → bookings` · `seq int` (Dodatok č.) ·
`description` · `extra_amount_cents` · `currency` · `rendered_url` (PDF) · `payload_json` ·
`audit_log_json` · `signed_by_worker_at` · `signed_by_poster_at` · `created_at`
> Same OTP/scan sign flow as the parent contract; extra escrow not released until signed.
> **Cannot change the contract `type`** — only extend scope + pay. Hours roll into `work_hours_counters`.

### work_hours_counters  *(350h DoVP limit, per employer×worker×year, v2.7 §3.1)*
`id` · `poster_user_id → users` · `worker_user_id → users` · `year int` ·
`seed_hours numeric` (entered at registration, 0–349) · `accrued_hours numeric` (from attendance) ·
`total_hours generated` (= seed + accrued) · `created_at`  *(unique (poster,worker,year))*
> Warn at 315h (90%), **block new DoVP at 350h** → suggest DoPČ. Per-employer, not global.

### attendance_events  *(QR check-in/out — promoted from V2, v2.7 §9.4; + UX-Spec S6 fields)*
`id` · `booking_id → bookings` · `kind` (check_in|check_out) · `scanned_by → users` (poster) ·
`qr_nonce` · `device_timestamp` · `server_timestamp` ·
`lat numeric?` · `lng numeric?` *(poster's GPS at scan; null if denied — non-blocking in MVP)* ·
`created_at`
> Dynamic QR scanned by the poster. Source of truth for worked time → feeds
> `work_hours_counters`, Brigy earning, and dispute evidence. N check-in/out pairs per
> booking (multi-day jobs); total time = sum of sessions.

### qr_nonces  *(ephemeral — UX-Spec S6)*
`nonce uuid pk` · `booking_id` · `worker_user_id` · `expires_at` (TTL 65 s; rotated every
60 s client-side) · `used_at` (replay-proof: one scan per nonce) · `created_at`
> Cron cleanup of expired rows. Server validates: exists + unexpired + matches booking +
> scanner is that booking's poster.

### brigy_ledger  *(internal loyalty coins — append-only, v2.7 §7)*
`id` · `user_id → users` · `entry_type` (earn|spend|adjust) · `delta int` (signed, coins) ·
`reason` (hour|rating5|referral|monthly_bonus|premium|topup|...) · `ref_booking_id` ·
`ref_referral_id` · `created_at`
> Balance = sum of deltas. **100 Brigy = 1 €, NON-CONVERTIBLE to EUR / no payout** (C-11/C-13 —
> convertibility ⇒ EMI licence). Spend only on in-app premium. Not transferable between accounts.

### referrals  *(v2.7 §8)*
`id` · `inviter_user_id → users` · `invitee_user_id → users` (null until signup) · `code` ·
`status` (pending|converted|blocked) · `converted_booking_id → bookings` · `created_at`
> Hard conversion: invitee completes + is paid a first real escrow job → +150 Brigy each.
> Lifetime cap 600 Brigy/inviter (then XP only). Anti-fraud block on matching
> IBAN / phone / device_id hash.

## UX-Spec B4/B5/Part C additions (2026-06-12)

### support_conversations · support_messages  *(S11 — one conversation per user)*
`support_conversations`: `id` · `user_id` · `dispute_id?` (auto-linked from S8) ·
`status` (open|resolved|closed) · `created_at` · `resolved_at`.
`support_messages`: `id` · `conversation_id` · `sender_user_id` · `sender_type`
(user|agent|system) · `content` · `attachment_urls text[]` · `read_at` · `created_at`.
> Agents reply from the admin panel; shown to the user as "Brigzy Support" (anonymized).

### verified_applications  *(B5.3 Brigzy Verified)*
`id` · `user_id` · `status` (pending|approved|rejected) · `reviewed_by → users` (admin) ·
`rejection_reason` · `created_at` · `reviewed_at`
> Criteria checked at apply time: ≥10 completed, ≥4.5★ (min 5 reviews), Stripe Identity
> done, phone verified, strikes < 3, rank ≥ Skúsený. Grant → `users.brigzy_verified=true`
> + `verified_at`. Revoke = manual only.

### worker_listing_profiles · worker_availability · listing_contacts  *(B5.4 inzertný mód — flag `brigzy_verified_enabled`)*
`worker_listing_profiles`: `id` · `user_id` · `bio (200)` · `preferred_rate_cents` ·
`skills text[]` · `weekly_capacity_hours` · `is_active` · `updated_at`.
`worker_availability`: `id` · `user_id` · `available_from` · `available_to`.
`listing_contacts`: `id` · `poster_user_id` · `worker_user_id` · `conversation_id` ·
`credit_charged bool` · `created_at`.

### Admin panel (Part C — [[Admin-Panel-Spec]])
- `users` extra: `is_admin bool default false` · `frozen_at timestamptz?` (soft ban) ·
  `dispute_strikes int default 0` · `brigzy_verified bool` · `verified_at`
- `feature_flags`: `key pk` · `value jsonb` · `description` · `updated_by` · `updated_at`
- `broadcast_log`: `id` · `sent_by` · `segment` · `title` · `body` · `recipient_count` · `sent_at`
- `admin_actions`  *(audit log — promoted to MVP per [[Spec-Audit-2026-06-11]])*:
  `id` · `admin_user_id` · `action` (release|refund|split|freeze_user|flag_change|verify_grant|…) ·
  `entity_type` · `entity_id` · `payload_json` (amount, pct, reason) · `created_at`
  > **Every money-touching admin action goes through the same Edge Functions as the app**
  > (idempotency + state machine + this log) — never direct DB mutation.

## Deferred to V2/Future (not yet modeled)
multi-manager company users · insurance records (FinExpert/Universal — C-5, licence-gated,
S9 paused pending FinExpert agreement) · ads inventory · premium subscriptions (entitlement
table) · accounting export jobs (PDF/CSV/XML) · two-tier-fee config table (paušál threshold
+ % — once rates are set, C-8) · listing-contact monetization (credit/subscription — B5.4 fáza 2).

## RLS principles
- A user reads/writes only their own rows (worker sees own applications/bookings/ledger).
- Posters manage their own jobs + see applicants to those jobs.
- Money tables (`escrow_transactions`, `wallet_ledger`, `payouts`) are **service-role
  only** — mutated solely by Edge Functions, never directly by the client.
