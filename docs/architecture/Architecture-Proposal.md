---
title: Architecture Proposal — Brigzy.sk MVP
type: architecture
status: draft
updated: 2026-06-02
---

# Architecture Proposal — Brigzy.sk MVP

Per-layer recommendation with **why / alternatives / trade-offs**. Optimized for:
speed of launch · low complexity · low cost · scalability · maintainability ·
real-world validation. Legal-dependent parts are flagged (see [[Legal-Compliance-Register]]).

## Summary diagram (logical)

```
[ Expo RN app (iOS/Android) ]  ──PostgREST/Realtime──>  [ Supabase Postgres + RLS ]
        │  │                                                   │
        │  └── Supabase Auth (JWT)                             │ Storage (avatars, contracts)
        │                                                       │
        └── HTTPS ──> [ Supabase Edge Functions (Deno) ] ──> [ Stripe Connect (test) ]
                              │   ^                                  │
                              │   └────── Stripe webhooks ───────────┘
                              └──> [ Expo Push API ]
[ Vercel ]  ── marketing landing + (future) admin/stats dashboard
```

## Frontend — Expo + React Native + TypeScript + NativeWind/StyleSheet
- **Why:** already in use; one codebase → iOS + Android (+ web); Expo Router, OTA via
  EAS, fast iteration for a demo. Reuse wired screens (ADR-0001).
- **Alternatives:** Flutter (rewrite, no), native iOS+Android (2× work, no),
  React Native CLI w/o Expo (lose EAS/OTA convenience).
- **Trade-offs:** RN perf ceiling vs native; claymorphism shadow limits on Android (R-12).
- **Design:** claymorphism token layer + component kit (ADR-0003).

## Backend — Supabase (Postgres + Auth + Realtime + Storage + Edge Functions)
- **Why:** BaaS removes most server work; Postgres is relational (fits bookings/ledger/
  reviews); Row-Level Security enforces authz at the DB; Realtime powers chat;
  Edge Functions (Deno/TS) host the only custom server logic (Stripe). Already adopted.
- **Alternatives:** custom Node/NestJS API (more control, much more to build/run —
  rejected for MVP), Firebase (document model fits money/ledger poorly).
- **Trade-offs:** vendor lean-in; complex transactional logic in Edge Functions is less
  ergonomic than a full server. Acceptable at MVP; revisit a dedicated service at scale.

## Database — Postgres (managed by Supabase)
- **Why:** transactional integrity for escrow/wallet/ledger; relational modeling;
  RLS; SQL reporting for the future admin dashboard. Amounts as **integer minor units +
  currency** (multi-currency ready, A-6). See [[Data-Model]].
- **Alternatives:** NoSQL (rejected — money needs ACID + joins).
- **Trade-offs:** schema discipline required; migrations must be tracked from day 1.

## Authentication — Supabase Auth (email/password for MVP)
- **Why:** built-in, JWT integrates with RLS, already wired. Add OAuth (Apple/Google)
  later. **KYC is separate** from auth — now **real 3-layer via Stripe** (Connect KYC + optional
  Stripe Identity + own Brigzy form for r.č./ZP at DoVP), not a stub (C-4, v2.7 §4; ADR-0004).
- **Alternatives:** Clerk/Auth0 (extra cost/integration, unneeded now).
- **Trade-offs:** must fix the existing dual session-tracking + profile-creation quirks.

## Payments / Escrow — Stripe Connect (Express), test mode for demo
- **Why:** Stripe holds funds (mitigates licensing risk C-2), supports
  charge-hold-release + transfers + payouts + application fees. See ADR-0002.
- **Alternatives:** Mangopay/Lemonway (EU marketplace-escrow specialists — strong for
  the real-money phase, evaluate at go-live), holding funds ourselves (licensing, no).
- **Trade-offs:** Connect onboarding adds worker UX; **gross/net release + licensing are
  PROVISIONAL pending C-1/C-2**. The release step is abstracted to absorb the legal outcome.

## Hosting — Supabase (backend) · Vercel (web) · Expo/EAS (mobile)
- **Why:** all have free/low tiers (A-21); Vercel ideal for the marketing landing page
  and the future Next.js admin/stats dashboard; EAS builds + OTA for the app.
- **Alternatives:** self-host (ops burden, no), Netlify/Cloudflare (fine; Vercel chosen by owner).
- **Trade-offs:** multiple providers to manage; acceptable.

## Notifications — Expo Notifications + Edge Function sender
- **Why:** owner wants real push in the demo (A-20); Expo Push API is simplest with Expo.
  Store device tokens per user; send on key events; "new job nearby" by region.
- **Alternatives:** FCM/APNs directly (more setup), OneSignal (3rd party).
- **Trade-offs:** SOS *mass*-push at scale needs batching/fan-out → simplified for MVP, full in V2.

## Maps — Leaflet + OpenStreetMap tiles (WebView) + Nominatim geocoding
- **Why:** already implemented, **free, no API key** (Codebase-Reuse-Assessment).
  Extend single-pin → all-jobs pins + radius filter + clustering.
- **Alternatives:** Google Maps / Mapbox (better UX + native `react-native-maps`, but
  cost + keys). Upgrade post-validation if maps become central.
- **Trade-offs:** WebView map is less smooth than native; fine for MVP. Nominatim has
  rate limits/usage policy → cache geocodes, consider a paid geocoder later.

## Analytics — PostHog (free tier) [proposed]
- **Why:** product analytics + funnels to learn from the "feedback" goal; EU hosting option (GDPR).
- **Alternatives:** Firebase Analytics, Amplitude. **Trade-off:** add only if it doesn't
  cost sprint time; can ship demo with minimal event logging and add right after.

## Monitoring / Errors — Sentry (free tier) [proposed]
- **Why:** crash/error visibility during a fast sprint + live demo; RN + Edge Function SDKs.
- **Alternatives:** Expo's built-in logging only (thinner). **Trade-off:** small setup cost,
  high value for a live investor demo (catch crashes early).

## Logging — Supabase logs + structured logs in Edge Functions
- **Why:** payment/escrow flows must be auditable (disputes, money movement). Log every
  state transition with booking id + stripe ids. **Trade-off:** must avoid logging PII/secrets (GDPR C-9).

## Cross-cutting
- **i18n:** consolidate to ONE system; locale as data; SK + EN at MVP, more later (A-6).
- **Money:** integer minor units + ISO currency everywhere; never floats.
- **Security/authz:** RLS policies per table; Stripe secrets only in Edge Functions; webhooks verified.
- **Migrations:** tracked SQL migrations from day 1 (the prototype lacks this).
