---
title: Feature Breakdown — Brigzy.sk
type: spec
status: draft (pending owner sign-off)
updated: 2026-06-01
---

# Feature Breakdown — MVP / V2 / Future

> Draft strawman for the **26.6.2026 demo MVP** (marketing + investor + feedback).
> 2 devs · 25 days · Stripe **test mode** · legal parked. Owner to confirm/adjust.
> MVP is split into **Tier 1 (functional)** and **Tier 2 (demonstrable shell)**.

## MVP — Tier 1 (functional, works end-to-end in test mode)

- Auth + onboarding (reuse existing)
- Roles: Worker, Poster-C2C, Poster-B2B (B2B company fields minimal)
- Post a job (reuse) incl. category, pay, location, "free slots" count (data only)
- **Discover:** all-jobs **map with pins + radius filter** + list/search *(extend existing single-pin map)*
- Apply + 1:1 chat (reuse)
- **In-chat price negotiation** (counter-offer → accept/reject → escrow recalculates)
- **Stripe escrow charge on confirm** (test mode) → state **Pending**
- **Auto-generated contract** + digital click-sign screen — contract **type matrix**
  (DoVP / DoPČ / Zmluva o dielo) auto-selected by poster×task; **AdES-level** sign + audit
  log *(templates pending advokát; C-1/C-3, [[ADR-0005-employment-contract-model]])*
- Work approval → **escrow release** (test) → **wallet ledger** updates → state **Cleared**
- **Internal wallet** (real ledger, test funds) + payout-request UI (no real SEPA yet)
- **Blind two-way reviews** (revealed when both submit)
- "Report a problem" → marks payment **Disputed** (manual handling; no full ticketing)
- **Push notifications** (real, basic): device token + "new job nearby" + key events (A-20). *SOS mass-push logic simplified → full version V2.*

## MVP — Tier 2 (demonstrable shell, stubbed backend — for the demo narrative)

**Owner-selected for the 26.6 demo:**
- ✅ **KYC** — now **real via Stripe** (Identity / Connect onboarding), not a hand-rolled
  stub. Demo may show it in Stripe test mode. AML borne by Stripe. ([[ADR-0004-kyc-via-stripe]])
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
  automation** (RLFO XML/API under power of attorney), levies, tax withholding, **350h
  per-employer counter** + warnings *(heavy; needed before B2C real-money employment; C-1)*
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
- **Referral system** + anti-fraud (Device-ID, bank/phone match) *(legal C-9)* — reward
  model TBD: free-Premium-weeks vs **Brigzy Coins** vs XP (see [[Feature-Ideas]] IDEA-1)
- Tax/accounting **exports** (worker PDF, firm CSV/XML Pohoda/Kros) *(legal C-7)*
- **Web admin / statistics dashboard** (explicitly "later", A-11)

## Future Vision

- **Liability insurance** integration (FinExpert Group) *(legal C-5 — needs signed partner)*
- **Multi-country** expansion + multi-currency *(legal C-10)*
- Additional **in-app languages**
- B2B **multi-manager** accounts + bulk ad management + invoicing
- Advanced ranking algorithm (verified experience, education weighting)
- Advanced anti-fraud / risk scoring

## Hard rules

- **Escrow is mandatory MVP** — built + demoable (test mode). Never removed/simulated
  away without explicit owner approval. Real-money switch gated by legal (C-1/C-2).
- Anything touching a [[Legal-Compliance-Register]] row is **provisional** until verified.
