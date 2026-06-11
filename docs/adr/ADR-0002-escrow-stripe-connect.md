---
title: ADR-0002 — Escrow via Stripe Connect (test-mode demo; real-money gated by legal)
type: adr
status: accepted
date: 2026-06-02
updated: 2026-06-03
---

> **Update 2026-06-03 (research-confirmed + owner decision):** Stripe Connect is the
> LOCKED payment architecture — "everything through Stripe". The *Brigzy research Report*
> confirms: own wallet/escrow would need an NBS payment/EMI licence (zák. 492/2009);
> **Stripe Connect avoids it** because STEL is an EMI authorized by Central Bank of Ireland
> (ref C187865), and **Stripe holds the funds, not Brigzy**. Implement "escrow" as Stripe
> **delayed / manual payouts** (hold on the connected account, up to 90 days) rather than a
> custom hold. Hard rule: **Brigzy must never hold user funds** at any moment. €15 min
> payout = contractual (disclose in ToS), not legal. Payout timing must respect labour-law
> due dates (DoVP after completion; DoPČ by end of next month). Status → accepted.

# ADR-0002 — Escrow via Stripe Connect

## Context
Escrow is a **mandatory MVP feature** (owner directive; not to be downgraded). The
26.6 milestone is a demo (no real money). The worker payment/employment & money-
licensing model is **parked pending lawyer** ([[Legal-Compliance-Register]] C-1, C-2).
We must build escrow now without baking in an unverified legal model.

## Decision
Implement escrow with **Stripe Connect** using the **separate-charges-and-transfers**
pattern, run in **TEST MODE** for the demo:

1. Workers onboard as **Stripe Connect Express** connected accounts (test).
2. On poster confirm → create a **PaymentIntent with immediate capture** charging the
   poster to the **platform** account → state **Pending** (funds actually charged and
   held on the platform balance).
   > ⚠️ **NOT manual capture** (fixed 2026-06-11): an uncaptured authorization expires
   > after ~7 days, which breaks any job scheduled further out, multi-day jobs, or a
   > poster approving late. We charge immediately; "escrow" = the funds sit on the
   > platform balance until release. Cancellation = a real **Refund** (full or tiered
   > per the cancellation policy), not a void of authorization.
3. On price re-negotiation → recompute required amount before the job is "binding"
   (charge the difference / partially refund).
4. On poster approval → **Transfer** to the worker's connected account is *scheduled*
   + record a **credit in the internal wallet ledger** for the worker (minus service
   fee) → state **Cleared**.
5. **Payout** (≥ €15, pooled) → payout from the connected account balance to the
   worker's bank (manual payout schedule on the connected account).
6. Dispute → freeze (no transfer) → state **Disputed** → resolve = transfer /
   refund / split.

The **"release" step and the gross-vs-net split are abstracted behind one service
function** so the legal outcome (contractor gross vs. employment net) can be slotted
in without reworking the flow.

## Alternatives considered
- **Destination charges (`on_behalf_of` + `transfer_data`):** simpler but couples
  charge to a single payee at charge time — worse fit for hold-then-release + wallet
  pooling. Rejected.
- **Hold money ourselves (own bank/ledger only):** very likely requires an
  EMI/payment-institution licence (C-2). Rejected — let Stripe hold funds.
- **Manual/test simulation with no Stripe at all:** violates "escrow is real, built"
  directive. Rejected — we build the real Stripe integration, just in test mode.

## Consequences
- Real, demonstrable escrow flow at the demo; flip test→live is a config + legal gate.
- **PROVISIONAL** until C-1/C-2 verified: licensing for holding wallet balances, the
  gross/net release math, and contract type all depend on the lawyer (today, A-15).
- Adds the only mandatory server-side surface: Edge Functions + Stripe webhooks.
- Amounts stored in **minor units (integer cents) + currency code** (multi-currency ready).

## Links
[[Legal-Compliance-Register]] (C-1, C-2) · [[Lawyer-Questions]] · [[API-Design]] · [[Data-Model]]
