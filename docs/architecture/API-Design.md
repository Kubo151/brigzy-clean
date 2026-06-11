---
title: API Design — Brigzy.sk
type: architecture
status: draft (reconciled to v2.7)
updated: 2026-06-07
---

# API Design — Brigzy.sk

> **Reconciled to [[Brigzy-Spec-v2.7]] (2026-06-07).** KYC is now **real 3-layer via Stripe** (not
> a demo stub); contracts add the **Dodatok** (addendum) flow + **OTP (AdES)** signing; cancellation
> is **core** (B2C tiered refund + B2B 20%); new surfaces for **QR attendance**, **cross-sell**,
> **Brigy coins**, and **referrals**.

Two surfaces:
1. **Data API** — Supabase auto-generated **PostgREST + Realtime** over tables, guarded
   by **RLS**. The client uses `supabase-js` directly for normal CRUD/queries/subscriptions.
2. **Service API** — **Supabase Edge Functions** (Deno/TS) for anything needing the
   Stripe secret key, money-state transitions, contract rendering, or push fan-out.
   Money tables are service-role only (see [[Data-Model]] RLS).

## Data API (client via supabase-js + RLS)
- **Jobs:** list/filter (category, radius via lat/lng bounding box + Haversine, search), get, create, update/close. Realtime subscribe for map/list.
- **Applications:** create, list mine, list-for-my-job, withdraw.
- **Conversations/messages:** list, send, mark read; Realtime subscribe.
- **Price proposals:** create, list for conversation. *(accept → via Service API to recompute escrow)*
- **Reviews:** create (visibility flipped server-side when both exist), list visible for a user.
- **Profiles/companies:** read public profile, update own.
- **Notifications:** list mine, mark read.

## Service API (Edge Functions)
Each verifies the caller's JWT, checks authorization, writes an audit log, is idempotent.

### Payments / escrow  *(ADR-0002; PROVISIONAL on C-1/C-2)*
| Function | Purpose |
|----------|---------|
| `POST /connect/onboard-worker` | Create Stripe Connect Express acct + return onboarding link; store `stripe_account_id`. |
| `POST /bookings/confirm` | Poster confirms worker → create PaymentIntent (**immediate capture** — funds charged to the platform balance; ⚠️ NOT manual capture, auth expires in ~7 days) for agreed amount + service fee → `escrow=pending`, `booking=escrow_pending`. |
| `POST /bookings/recompute-escrow` | After an accepted price proposal → charge the difference / partial refund; booking not "binding" until fully covered. |
| `POST /bookings/release` | Poster approves work → **Transfer** to worker's connected account + credit worker `wallet_ledger` (minus fee) → `escrow=cleared`. **Gross/net split abstracted here (C-1).** |
| `POST /bookings/cancel` | Cancellation rules (v2.7 §10.2): B2C tiered refund (>24h full / 12–24h 80% / <12h 50%, remainder = provable-cost/damage, **not a penalty**); B2B contractual penalty up to 20% → refund/partial via Stripe. |
| `POST /bookings/cross-sell` | Re-hire same worker through escrow (v2.7 §9.5) → new booking with `parent_booking_id` + fresh contract. |
| `POST /disputes/open` | Freeze escrow → `state=disputed`; create dispute row. |
| `POST /payouts/request` | Balance ≥ €15 → Stripe Transfer→payout to connected acct → `payouts` row. |
| `POST /stripe/webhook` | Verify signature; handle `payment_intent.*`, `transfer.*`, `payout.*`, account updates → advance state machine. |

### Contracts  *(PROVISIONAL on C-1/C-3/C-12 — templates pending lawyer)*
| `POST /contracts/generate` | Render template (type per legal model + 350h check) with booking data → store PDF in Storage → `contracts` row. |
| `POST /contracts/sign` | Record signature: **OTP (AdES)** verify or **BOK scan** upload; set `signed_by_{worker,poster}_at`; auto-deliver PDF copy to both; when both signed + escrow covered → `booking=in_progress`. |
| `POST /contracts/addendum` | **Dodatok** for extra work (v2.7 §9.5): create `contract_addendums` row + extra PaymentIntent into escrow; same OTP/scan sign flow; extra funds not released until signed; roll hours into counter. Cannot change contract type. |

### Notifications  *(A-20)*
| `POST /push/register` | Upsert `push_tokens`. |
| `POST /notifications/send` | Internal: send Expo push + persist notification. Triggers: new nearby job, application accepted, escrow events, new message, review request, SOS (simplified fan-out). |

### KYC  *(real 3-layer via Stripe — C-4, v2.7 §4)*
| `POST /kyc/connect-onboard` | Stripe Connect KYC (payments) — part of worker onboarding. |
| `POST /kyc/identity-session` | Optional **Stripe Identity** session (doc+selfie) → store result. |
| `POST /kyc/payroll-details` | Own Brigzy form at **DoVP creation**: rodné číslo + health insurer + permanent address + IBAN (encrypted in `contracts.payload_json`); never at registration. |

### Attendance (QR) · Brigy · Referrals  *(v2.7 §9.4, §7, §8)*
| `POST /attendance/scan` | Poster scans worker's dynamic QR → `attendance_events` (check_in/out + GPS) → updates `work_hours_counters`, Brigy earning. |
| `POST /hours/seed` | Registration hours-input (0–349) → seed `work_hours_counters` per employer. |
| `POST /brigy/earn`, `POST /brigy/spend` | Append `brigy_ledger` entries (earn rules / premium spend). **No EUR conversion/payout endpoint** (C-11/C-13). |
| `POST /referrals/redeem` | Bind invitee to code; on hard conversion (first paid escrow job) credit +150 Brigy each, enforce 600 cap + anti-fraud match. |

## Escrow state machine (authoritative)

> **Ordering fixed 2026-06-11: FUND → SIGN.** The poster funds escrow at selection
> (S5, right after picking the worker); the contract is signed after funding (S3).
> This matches the A6 spine + P5 timeline in [[UX-Spec]]. Funding first = the poster
> proves intent before the worker commits; cancel-before-sign = trivial full refund.

```
booking: draft → escrow_pending → awaiting_signatures → in_progress → completed → cleared
                      │                   │                                    └─(dispute)→ disputed
                      └─(cancel)→ cancelled (full refund — nothing signed yet)
escrow:  created → pending ──(release = Transfer)──> cleared
                      │  └────(dispute)──> disputed ──(resolve)──> cleared|refunded|split
                      └────(cancel)──────> refunded (full pre-sign; tiered post-sign)
```
All transitions happen **only** in Edge Functions, are **logged**, and are reconciled by webhooks.
Admin-panel manual actions (release/refund) call these same functions — never direct DB writes.

## Conventions
- Errors: structured `{ error: { code, message } }`; never leak Stripe/PII in client errors.
- Idempotency keys on all Stripe-mutating calls.
- Amounts: integer cents + currency in every request/response.
- Authz: re-check ownership server-side even though RLS exists (defense in depth).
