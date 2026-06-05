---
title: ADR-0004 — KYC / AML via Stripe (Identity + Connect onboarding)
type: adr
status: accepted
date: 2026-06-03
---

# ADR-0004 — KYC / AML via Stripe

## Context
The platform needs identity verification (KYC) for workers (and posters who receive/handle
money) and must address AML. Owner decision: "everything through Stripe — escrow and KYC
mainly." The *Brigzy research Report* analyses the AML status under zák. 297/2008.

## Decision
Use **Stripe for KYC/AML**, riding on the Stripe Connect decision (ADR-0002):
- Worker (and money-receiving poster) identity verified via **Stripe Connect onboarding /
  Stripe Identity** (document + selfie + bank account).
- Because **Brigzy holds no funds**, Brigzy is **not a "povinná osoba"** under §5 zák.
  297/2008 → AML obligations (CDD, sanctions screening, monitoring, reporting) are borne by
  **Stripe** (regulated EMI). Brigzy stays a marketplace/sprostredkovateľ.
- **rodné číslo is NOT collected at registration.** It is collected **only when a DoVP
  arises** (needed for SP/ZP registration, payroll, tax). Onboarding needs only name,
  surname, DOB, address. (§78(4) zák. 18/2018; GDPR minimization.)

## Alternatives considered
- **Hand-rolled KYC / third-party KYC vendor + own wallet:** would make Brigzy a povinná
  osoba with full AML program + likely a payment licence. Rejected (cost, risk).
- **No KYC for demo (stub only):** acceptable ONLY for the test-mode demo; real KYC via
  Stripe is required before real money/contracts. (Demo may still use a stub screen.)

## Consequences
- KYC becomes a **real, mostly-managed feature** (Stripe UI/SDK), not a custom build —
  *easier* than the earlier "Tier-2 stub" assumption, and it can graduate toward MVP.
- Brigzy must still: surface KYC status, gate payouts/contracts on "verified", and sign a
  **DPA with Stripe** (+ SCC for non-EU transfer) — see [[Legal-Compliance-Register]] C-9.
- Re-validate "marketplace, not povinná osoba" with counsel once money-flow is final.

## Links
[[ADR-0002-escrow-stripe-connect]] · [[Legal-Compliance-Register]] (C-4, C-9) · [[Feature-Breakdown]]
