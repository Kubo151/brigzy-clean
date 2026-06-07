---
title: ADR-0005 — Employment / contract-type model (DoVP / DoPČ / Zmluva o dielo)
type: adr
status: proposed
date: 2026-06-03
---

# ADR-0005 — Employment / contract-type model

## Context
The original spec assumed a single auto-generated **DoVP**. The *Brigzy research Report*
shows this is legally insufficient and risky. This ADR records the model the app must
implement (pending final advokát sign-off — see [[Legal-Compliance-Register]] C-1/C-3).

## Decision
Implement a **contract-type matrix**, auto-selected by *poster type × task nature*:

| Poster | Task nature | Contract type |
|--------|-------------|---------------|
| Business (B2B) | result-defined one-off | **DoVP** (§226 ZP) — max 350 h/yr per employer, ≤12 mo, written before start |
| Business (B2B) | repeated activity (waiter, cleaning, warehouse) | **DoPČ** (§228a) — avg ≤10 h/week; seasonal ≤520 h/yr |
| Individual (C2C) | real *dielo* (tangible result) | **Zmluva o dielo** (§631–643 OZ) |
| (any) | activity with dependent-work signs | ❌ not allowed via these forms — flag/redirect |

Supporting decisions:
- **Brigzy is the intermediary (sprostredkovateľ), NEVER the employer.** Employer at a
  DoVP/DoPČ = the **zadávateľ**. Brigzy must not direct/control the work (else: employer or
  temp-agency status). Needs an **intermediary agreement + power of attorney** for acts
  toward SP/ZP.
- **E-signature: at least AdES** + robust process (identity at onboarding, OTP, audit log
  with timestamp/IP/doc version, deliver copy). KEP not required.
- **rodné číslo collected only at DoVP creation** (not registration) — see ADR-0004.
- **350-hour counter PER employer** + warnings (limit is per-employer; cross-employer sum
  can't and needn't be tracked).
- **Cancellation:** remove the void 20% consumer penalty (C-6) → reputation + provable-cost
  reimbursement + symmetric rules; contractual penalty only vs B2B posters.
- **SP/ZP registration automation** (RLFO XML/API in the zadávateľ's name, under PoA) is a
  later (real-employment) feature; legal responsibility stays with the zadávateľ.
- **Brigzy registers nobody and pays no odvody** — the firm does (RLFO before work, levies,
  tax). Brigzy only *assists* (one-click XML generation). **Pure Zmluva o dielo for all
  cases is forbidden** (švarcsystém). The contract auto-branch is one identical click for
  the user. *(Confirmed by `Platenie odvodov Brigzy.docx`, 2026-06-03.)*

## Update 2026-06-07 (v2.7 + accountant confirmed)
- **Accountant confirmed** the tax/levy side (no platform odvody/oznamovacie povinnosti; firm
  withholds 19/25 %; pass-through accounting). Still **proposed** overall because the **lawyer
  contract templates** + classification matrix sign-off remain open (non-blocking for build).
- **E-signature is committed to AdES** (v2.7 §3.3): SMS/e-mail **OTP** at signing, immutable audit
  log, **auto PDF copy to both parties**, with a **physical BOK-scan** alternative. Escrow does not
  lock until a signature (OTP or scan) is recorded.
- **Dodatok (addendum):** extra work on an active booking generates an automatic **Dodatok** to the
  existing contract (same sign flow). A Dodatok may extend scope/pay but **must not change the
  contract type** (DoVP↛DoPČ). Repeat hires (**cross-sell**) generate a fresh contract instead.
- **350h counter is core, seeded at registration:** the worker enters prior hours per employer
  (0–349) at signup; the counter warns at 315h and auto-blocks new DoVP at 350h → DoPČ.
- **Three-layer KYC** (Stripe Connect / Stripe Identity / own Brigzy form for r.č.+ZP+IBAN at DoVP)
  — see [[ADR-0004-kyc-via-stripe]] and v2.7 §4.

## Consequences
- Contract generator + data model need a **type enum** (`dovp` / `dopc` / `zmluva_o_dielo`)
  and task-nature classification in the post-a-job UX.
- The "real employment" path (DoVP/DoPČ with SP/ZP registration, levies, payroll, tax
  withholding) is **heavy** → for B2C employment it likely lands in V2, not the demo MVP.
  The **SZČO/contractor** path stays the lightest and may be the MVP default for go-live.
- Final classification (dielo vs. závislá práca; DoVP vs. DoPČ) is fact-based — needs
  advokát-approved templates + a clear in-app classifier + liability disclaimer.

## Links
[[Legal-Compliance-Register]] (C-1, C-3, C-6) · [[ADR-0004-kyc-via-stripe]] · [[Data-Model]] · [[Feature-Breakdown]]
