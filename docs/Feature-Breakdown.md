---
title: Feature Breakdown — Brigzy.sk
type: spec
status: draft (reconciled to v2.7 — phasing to re-decide)
updated: 2026-06-07
---

# Feature Breakdown — MVP / V2 / Future

> **Reconciled to [[Brigzy-Spec-v2.7]] (2026-06-07).** Originally a strawman for the 26.6.2026
> demo MVP with *legal parked*. Two things changed: (1) **accountant confirmed → CLEARED TO
> BUILD**, legal is no longer parked; (2) owner wants a **full rebuild of the entire app**, not a
> demo-only slice. So the **MVP / V2 / Future split below is now provisional** — the actual phasing
> (what lands first, what the 26.6 demo includes) is a fresh decision to be made in the build-plan
> step. v2.7 also **promotes** several items previously parked in V2 (350h counter, QR check-in,
> cancellation) and **adds new ones** (cross-sell, Dodatok/extra-work addendum, two-tier fee,
> FinExpert insurance integration, Brigy earning/spending engines, registration hours-input).
> MVP is split into **Tier 1 (functional)** and **Tier 2 (demonstrable shell)**.

## MVP — Tier 1 (functional, works end-to-end in test mode)

- Auth + onboarding (reuse existing)
- Roles: Worker, Poster-C2C, Poster-B2B (B2B company fields minimal)
- Post a job (reuse) incl. category, pay, location, "free slots" count (data only)
- **Discover:** all-jobs **map with pins + radius filter** + list/search *(extend existing single-pin map)*
- Apply + 1:1 chat (reuse)
- **In-chat price negotiation** (counter-offer → accept/reject → escrow recalculates)
- **Stripe escrow charge on confirm** (test mode) → state **Pending**.
  *v2.7 §6: service fee is **two-tier** — flat paušál up to a threshold, then % above it; exact
  threshold/rates computed pre-MVP (C-8).*
- **Auto-generated contract** + digital sign screen — contract **type matrix**
  (DoVP / DoPČ / Zmluva o dielo) auto-selected by poster×task; **AdES** sign via SMS/e-mail **OTP**
  (or physical BOK scan), audit log, **PDF copy auto-delivered to both parties**; escrow not
  locked until signed *(templates pending advokát; C-1/C-3/C-12, [[ADR-0005-employment-contract-model]])*
- Work approval → **escrow release** (test) → **wallet ledger** updates → state **Cleared**
- **Internal wallet** (real ledger, test funds) + payout-request UI (no real SEPA yet)
- **Blind two-way reviews** (revealed when both submit)
- "Report a problem" → marks payment **Disputed** (manual handling; no full ticketing)
- **Push notifications** (real, basic): device token + "new job nearby" + key events (A-20). *SOS mass-push logic simplified → full version V2.*

## MVP — Tier 2 (demonstrable shell, stubbed backend — for the demo narrative)

**Owner-selected for the 26.6 demo:**
- ✅ **KYC** — **three layers (v2.7 §4):** Stripe Connect KYC (payments, built-in) + Stripe
  Identity (optional doc+selfie) + **own Brigzy form** for rodné číslo + ZP, collected **only at
  DoVP/DoPČ creation** (never at registration; §78(4) z.č.18/2018). AML borne by Stripe.
  ([[ADR-0004-kyc-via-stripe]])
- ✅ **Registration hours-input (v2.7 §3.1):** at signup the worker enters hours already worked
  this year per employer (0–349) → seeds the **350h DoVP counter** (warn @315h, auto-block @350h
  → DoPČ). Counter promoted from V2 to core because contracts depend on it.
- ✅ **XP / rank / badges** display on profile (computed simply or seeded)
- ✅ **Support chat (NON-AI)** — plain support/contact chat. *AI bot → Future.*
- ❌ Insurance claim flow — NOT in demo (→ Future, needs FinExpert; legal C-5)

## MVP — Cross-cutting workstream: COMPLETE REDESIGN

- ⚠️ **Full visual redesign in claymorphism style** (soft 3D, pastel, puffy shadows),
  possibly sourced from **Figma**. The app will look nothing like the current prototype.
- **Impact:** existing screens' **visuals are discarded**; only **logic/data wiring,
  state, navigation, types** are reused. Reuse drops from "≈70% UI" to "logic only".
  This is a major addition to the 25-day scope — see R-11.
- claymorphism on React Native = many shadows/gradients/blurs → watch performance (R-12).

## V2 — Growth (after demo, before/around real-money launch)

- **Real-employment path:** DoVP/DoPČ + **Sociálna/zdravotná poisťovňa registration
  automation** (RLFO XML/API under power of attorney), levies, tax withholding *(heavy; needed
  before B2C real-money employment; C-1)*. *Note: the **350h per-employer counter** is now core
  (moved to Tier-1 above), since contract-type selection depends on it.*
- **Cross-sell — "Pracovať znova" (v2.7 §9.5):** after a finished job, offer the poster to
  re-hire the same worker through escrow (capturing repeat relationships that would bypass the
  platform). Each repeat = a fresh auto-generated DoVP/DoPČ.
- **Dodatok — "+ Práca navyše" (v2.7 §3.3, §9.5):** during an active job the poster adds extra
  work + amount → worker accepts → difference into escrow → system auto-generates **Dodatok č. 1**
  to the existing contract (same OTP/scan sign flow; extra escrow not released until signed). Hours
  roll into the 350h counter. A Dodatok can extend scope/pay but **cannot change the contract type**.
- Real **SEPA payouts** via Stripe Connect (delayed/manual payout) + €15 pooling + scheduling
- **Long-term jobs = advertising / "Brigzy Verified" listings** mode (flat-fee/featured/
  company packages) — the *second* business mode, added after a verified-worker base exists
  (see [[Business-Model]])
- **SOS mass-push** to all nearby workers + Premium priority timing (basic push is MVP)
- **Group jobs / multi-slot** with auto group chat
- **AI support bot** (answers ~80% of repetitive questions; escalates to ticket)
- **Dispute / ticket** system (operator console) + escrow freeze workflow
- **QR check-in / check-out** (worked-time proof)
- **Cancellation policy** — NOT the void 20% consumer penalty (C-6); reputation +
  provable-cost reimbursement + symmetric rules; contractual penalty only vs B2B posters
- **Premium subscription** (ad-free, priority, profile boost)
- **In-app ads** (native listings, banners, interstitials)
- **Referral system** + anti-fraud (Device-ID, bank/phone match) *(legal C-9)* — v2.7 §8 commits
  the reward to **Brigy coins**: 150 to inviter + 150 to invitee, hard conversion (invitee must
  complete + be paid a first real escrow job), lifetime cap **600 Brigy** (then +100 XP only).
- **Brigy coin engines (v2.7 §7):** earning (+10/h, +25 per 5★, +150 referral, +50 monthly @≥4.8)
  and spending (Premium 500 Brigy, topovanie, badges). ⚠️ **Non-convertible to EUR** (else EMI
  licence — C-11/C-13). 100 Brigy = 1 €, in-app premium only.
- Tax/accounting **exports** (worker PDF, firm CSV/XML Pohoda/Kros) *(legal C-7)*
- **Web admin / statistics dashboard** (explicitly "later", A-11)

## Future Vision

- **Liability insurance** integration — **Universal / FinExpert Group** (v2.7 §10.1): opt-out
  checkbox at job creation → job data auto-sent via API → e-mail confirmation to both parties; AI
  bot collects photos on a claim → escrow freeze → FinExpert broker. ⚠️ **Gated by C-5** — may
  require a financial-agent licence (z.č. 186/2009); needs signed partner. No build/demo of it
  until the lawyer clears the licence question.
- **Multi-country** expansion + multi-currency *(legal C-10)*
- Additional **in-app languages**
- B2B **multi-manager** accounts + bulk ad management + invoicing
- Advanced ranking algorithm (verified experience, education weighting)
- Advanced anti-fraud / risk scoring

## Hard rules

- **Escrow is mandatory MVP** — built + demoable (test mode). Never removed/simulated
  away without explicit owner approval. Real-money switch gated by legal (C-1/C-2).
- Anything touching a [[Legal-Compliance-Register]] row is **provisional** until verified.
