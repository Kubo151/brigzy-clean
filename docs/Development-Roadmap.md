---
title: Development Roadmap — Brigzy.sk
type: plan
status: draft (superseded framing — rebuild plan pending)
updated: 2026-06-07
---

# Development Roadmap

> **⚠️ Reframed 2026-06-07.** This roadmap was written as a *24-day demo sprint with legal parked*.
> Two things changed: **accountant confirmed → CLEARED TO BUILD** (legal no longer parked; only
> lawyer contract templates remain, non-blocking), and the owner wants a **full rebuild of the
> entire app** per [[Brigzy-Spec-v2.7]] — not a demo-only slice. The phase plan below is kept for
> reference but its scoping is **provisional**; a fresh **rebuild build-plan** (sequence,
> dependencies, what the 26.6 demo includes vs later) is the next planning deliverable. Note v2.7
> **promotes** 350h counter, QR check-in and cancellation into the core, and **adds** cross-sell,
> Dodatok, two-tier fee, Brigy engines, FinExpert insurance (licence-gated, C-5).

Phases per the original brief. 2 devs, parallelized: **Dev A = UI/redesign + screen integration**,
**Dev B = backend/escrow/Edge Functions**. AI = design system + mockups + scaffolding + docs.

## Phase 1 — MVP demo (24 days)

**Critical path = escrow.** De-risk it first. Run two parallel tracks.

### Days 1–3 — Foundations (both)
- Pick ONE i18n system; track SQL migrations; create new schema ([[Data-Model]]).
- AI delivers **claymorphism mockups (2–3 palettes)** → owner+David **sign-off** (gate).
- Dev B: Stripe Connect test account, Edge Function skeleton + webhook + first PaymentIntent spike.
- Dev A: codify chosen tokens → core component kit (Button, Card, Input, Sheet, JobCard).

### Days 4–10 — Core loop functional (test mode)
- Dev B: `confirm` → escrow PaymentIntent (hold), `release` → capture + wallet ledger,
  `disputes/open`, state machine + webhooks. Wallet balance derivation.
- Dev A: reskin auth, job feed, **all-jobs map + radius filter**, job detail, post-job,
  apply, chat. Wire price-proposal UI.
- Joint: contract generate + click-sign screen (template provisional, C-1/C-3).

### Days 11–16 — Trust + the demo shells
- Reviews (blind two-way). XP/rank/badges display (seeded). Push (register + send + nearby/events).
- Tier-2 shells: KYC screens (stub), support chat (non-AI).
- Wallet screen + payout-request UI (≥€15, test).

### Days 17–21 — Polish, integrate, harden
- End-to-end test of the full loop in Stripe test mode on real devices (incl. low-end Android, R-12).
- Sentry; empty/error/loading states; claymorphism consistency pass; seed demo data.

### Days 22–24 — Demo readiness
- Scripted demo path + seeded accounts; bug bash; build via EAS; rehearse.
- "Beta / test mode" labeling (R-10). Marketing landing on Vercel (optional).

**Phase-1 gates:** (1) design sign-off ~Day 3; (2) escrow happy-path green ~Day 10;
(3) full loop demoable ~Day 16; (4) frozen + rehearsed ~Day 24.
**Explicitly NOT in Phase 1 (original framing):** real money, SEPA payouts, ads, premium, AI bot,
insurance, accounting exports, web admin.
> *v2.7 note: KYC is real-via-Stripe (3 layers), and 350h counter + QR check-in are now core, not
> deferred. Re-decide demo scope in the rebuild build-plan.*

## Phase 2 — Growth features (post-demo, toward real-money launch)
Mostly **legally cleared** now (accountant done; lawyer owes only templates — C-1). Real SEPA
payouts + €15 pooling · cancellation-policy enforcement · group/multi-slot + group chat ·
dispute/ticket console · premium subscription · referral + anti-fraud (Brigy rewards) · cross-sell
+ Dodatok · push priority timing. **Flip Stripe test→live only after the lawyer signs off the
contract templates + VOP/GDPR package.** Insurance stays gated by C-5 (FinExpert licence).

## Phase 3 — Marketplace scaling
In-app ads (native/banner/interstitial) · AI support bot · accounting exports
(Pohoda/Kros) · **web admin/stats dashboard** (Next.js on Vercel) · advanced ranking ·
performance/scale work (consider dedicated service if Edge Functions strain) · analytics maturity.

## Phase 4 — Full vision
Liability insurance (FinExpert) · multi-country + multi-currency · more languages ·
B2B multi-manager + bulk ads + invoicing · advanced anti-fraud/risk scoring.

## Standing principles
- Escrow stays real + mandatory; only test↔live is a toggle.
- No feature depending on an unverified legal item ships to real users until verified.
- Every significant decision → an [[adr]]; every legal answer → update [[Legal-Compliance-Register]].
