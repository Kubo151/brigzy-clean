---
title: API Design — Brigzy.sk MVP
type: architecture
status: draft
updated: 2026-06-02
---

# API Design — Brigzy.sk

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
| `POST /bookings/confirm` | Poster confirms worker → create PaymentIntent (manual capture) for agreed amount + service fee → `escrow=pending`, `booking=escrow_pending`. |
| `POST /bookings/recompute-escrow` | After an accepted price proposal → adjust/replace the held amount; booking not "binding" until fully covered. |
| `POST /bookings/release` | Poster approves work → capture PI + credit worker `wallet_ledger` (minus fee) → `escrow=cleared`. **Gross/net split abstracted here (C-1).** |
| `POST /bookings/cancel` | Cancellation rules (20% <12h = V2) → refund/partial via Stripe. |
| `POST /disputes/open` | Freeze escrow → `state=disputed`; create dispute row. |
| `POST /payouts/request` | Balance ≥ €15 → Stripe Transfer→payout to connected acct → `payouts` row. |
| `POST /stripe/webhook` | Verify signature; handle `payment_intent.*`, `transfer.*`, `payout.*`, account updates → advance state machine. |

### Contracts  *(PROVISIONAL on C-1/C-3)*
| `POST /contracts/generate` | Render template (type per legal model) with booking data → store PDF/HTML in Storage → `contracts` row. |
| `POST /contracts/sign` | Record `signed_by_{worker,poster}_at`; when both signed + escrow covered → `booking=in_progress`. |

### Notifications  *(A-20)*
| `POST /push/register` | Upsert `push_tokens`. |
| `POST /notifications/send` | Internal: send Expo push + persist notification. Triggers: new nearby job, application accepted, escrow events, new message, review request, SOS (simplified fan-out). |

### KYC  *(Tier-2 STUB for demo; real provider V2 — C-4)*
| `POST /kyc/start`, `POST /kyc/mock-complete` | Drive the stub status (none→pending→verified) for the demo. |

## Escrow state machine (authoritative)
```
booking: draft → awaiting_signatures → escrow_pending → in_progress → completed → cleared
                                            │                                  └─(dispute)→ disputed
                                            └─(cancel)→ cancelled
escrow:  created → pending ──(release)──> cleared
                      │  └────(dispute)──> disputed ──(resolve)──> cleared|refunded
                      └────(cancel)──────> refunded
```
All transitions happen **only** in Edge Functions, are **logged**, and are reconciled by webhooks.

## Conventions
- Errors: structured `{ error: { code, message } }`; never leak Stripe/PII in client errors.
- Idempotency keys on all Stripe-mutating calls.
- Amounts: integer cents + currency in every request/response.
- Authz: re-check ownership server-side even though RLS exists (defense in depth).
