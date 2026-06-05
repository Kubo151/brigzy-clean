---
title: Lawyer Question Sheet — Brigzy.sk (meeting 2026-06-02)
type: discovery
status: action-needed
updated: 2026-06-01
---

# Lawyer Question Sheet — bring to the 2026-06-02 meeting

> 🇸🇰 **For the meeting (combined — the advisor is both lawyer + accountant):**
> [[Lawyer-Accountant-Questions-SK]] (markdown) → **`Brigzy-Otazky-pravnik-uctovnik.docx`**
> (Word, same folder; Part A právne, Part B účtovné/daňové, Part C demo). This English file
> is the internal reference (keeps the C-x register IDs). The older separate
> `Brigzy-Otazky-pre-pravnika/uctovnika.docx` were removed (superseded by the combined doc).

Goal: resolve the legal items that **block architecture** for escrow, payouts,
contracts, and KYC. Capture answers back into [[Legal-Compliance-Register]] and
create ADRs for anything that locks in design. Ordered by impact.

## 1. Worker payment & employment model  ⭐ CRITICAL (C-1)
- Can workers on Brigzy legally act as **self-employed / SZČO or "príležitostný
  príjem"** (contract = *Zmluva o dielo*), with the worker responsible for their
  own taxes/levies — and **no payroll obligation** on Brigzy or the poster?
- If a **Dohoda o vykonaní práce (DoVP)** is required instead: **who is the legal
  employer** — the poster or Brigzy? What are the resulting obligations
  (Sociálna poisťovňa pre-registration, levies, tax withholding, 350 h/year cap)?
- Can the same platform support **both** models (B2B = dohoda, C2C = Zmluva o dielo)?
- **What we need from you:** a definitive model so we build the right escrow
  release math (gross vs. net) and contract template.

## 2. Holding money & payouts — licensing  ⭐ CRITICAL (C-2)
- If Brigzy holds worker balances in an internal **Wallet** and runs **escrow**,
  does Brigzy need a **payment-institution / e-money (EMI) licence** in SK, or can
  we operate under **Stripe Connect** as the regulated payment provider (funds held
  by Stripe, not us)?
- Any limits on holding funds, settlement timing, or the **€15 minimum payout**?

## 3. Digital contracts  (C-3)
- Is a contract **signed by checkbox + button tap** legally binding for each type
  (DoVP vs. *Zmluva o dielo*)? Any e-signature / record-keeping requirements?
- Must we retain signed copies, and for how long?

## 4. KYC / AML  (C-4)
- What **identity verification** is legally required for workers (and posters)?
- Is collecting **rodné číslo** permissible/necessary, and under what basis?
- Are we subject to **AML** obligations as a marketplace + payment facilitator?

## 5. Service fee & VAT  (C-8)
- VAT treatment of the **platform service fee** ("€2 + 10%") and ad revenue.
- Invoicing requirements for B2B posters (faktúry for fees).

## 6. Cancellation penalty  (C-6)
- Is the **20%-of-escrow-to-worker** penalty for late poster cancellation
  enforceable under consumer-protection / contract law? How must it be disclosed?

## 7. GDPR  (C-9)
- Lawful basis + retention for **location data**, **Device-ID anti-fraud**, and
  **KYC documents**. Required **processor agreements** (Stripe, maps, future insurer)?

## 8. Insurance (informational)  (C-5)
- Any regulatory constraints on advertising **liability insurance** coverage
  (FinExpert partnership) before a signed agreement exists?

## 9. Demo posture (confirm we're safe)
- Confirm: a **test-mode demo with no real money movement** to investors/beta users
  carries **no licensing/employment exposure**. (Our working assumption A-9/A-10.)

---
**After the meeting:** update [[Legal-Compliance-Register]] statuses (→ VERIFIED with
source), close/adjust [[Open-Questions]] Q-LEGAL-1, and write an ADR for the chosen
payment/employment model.
