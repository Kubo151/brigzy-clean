---
title: Codebase Reuse Assessment — Brigzy.sk prototype
type: architecture
status: living
updated: 2026-06-01
---

# Codebase Reuse Assessment

Snapshot of the existing Expo + Supabase prototype (~13k LOC) vs. what the 26.6
demo MVP needs. Grounds the roadmap estimate. See `../../CLAUDE.md` for stack.

## ✅ Exists & reusable (UI wired to Supabase)

| Area | State | Notes |
|------|-------|-------|
| Auth (email/pw) | Working | Supabase Auth; Slovak errors; profile row created in `login.tsx` |
| Job feed (list) | Working | `(tabs)/index.tsx` reads `jobs` table; categories, search |
| Post job | Working | `add.tsx` inserts into `jobs` |
| Apply to job | Working | `apply/[id].tsx` inserts into `applications` |
| Chat / messages | Working | `messages/*` reads/writes `messages` table |
| Saved jobs | Working | `app-store` ↔ `saved_jobs` table |
| Profile / account | Working | `account*.tsx`, avatars storage bucket |
| Map (single location) | Working, FREE | Leaflet + OSM tiles in WebView; Nominatim geocoding; **no API key/cost** |
| Theming / i18n | Working (messy) | dark/light palette; TWO parallel i18n systems (texts.ts + translations.ts) |

## ⚠️ Partial / mock

| Area | State | Gap |
|------|-------|-----|
| Wallet | UI only (mock-data) | No real balance, no payouts, no ledger |
| Activity / history | Mock | Needs real transaction source |
| Map of all jobs | ❌ single-pin only | Spec wants all jobs as pins + radius filter + clustering |
| Roles (worker/C2C/B2B) | Basic role flag | No B2B company fields (IČO/DIČ), no multi-manager |

## ❌ Greenfield (the hard, money + trust backend)

- **Stripe escrow** (Connect, test mode): charge-on-confirm, hold, release, refund
- **Payment state machine** (Pending → Cleared / Disputed)
- **Internal wallet ledger** + payout (SEPA) + €15 pooling
- **Contract generation** + digital click-sign + storage
- **KYC / identity verification** (can be STUBBED for demo)
- **Blind two-way reviews** + XP/ranking
- **QR check-in/out**
- **Push notifications** (expo-notifications not yet installed)
- **Dispute / ticket** handling
- **Server-side logic**: needs Supabase **Edge Functions** for Stripe secret-key ops + webhooks (none exist yet)

## Reuse verdict

**UI shell ≈ 70% done; money/trust backend ≈ 0%.** The 26.6 demo is feasible *if*
we reuse the UI aggressively and concentrate the 2 devs on: (1) Stripe escrow in
test mode, (2) payment state machine + wallet ledger, (3) confirm→contract→sign→
release flow, (4) all-jobs map + radius. Stub KYC; defer ads/premium/AI-bot/
insurance/group/SOS/referral/tax-export/web-admin.

## Tech debt to be aware of (from CLAUDE.md)

- Two i18n systems — pick one before adding strings.
- Legacy + new duplicate screens (`job-detail.tsx` vs `job/[id].tsx`, etc.).
- `users` table is the profile table (not `profiles`).
- Profile creation lives in `login.tsx`, not `auth-store`.
