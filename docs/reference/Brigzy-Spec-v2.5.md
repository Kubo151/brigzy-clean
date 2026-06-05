---
title: Brigzy.sk — Canonical Product Spec v2.5 (from David)
type: reference
status: canonical
updated: 2026-06-03
source: "Brigzy_všetky podrobnosti.docx — v2.5 (Jún 2026), author: David/Renewo"
---

# Brigzy.sk — Canonical Product Spec v2.5

> **This supersedes the original v1.2 spec.** Unlike v1.2, v2.5 is **internally consistent
> with the legal research** ([[Legal-Compliance-Register]]) — Stripe Connect, the contract
> matrix, Brigzy-as-intermediary, no consumer cash penalty, etc. Faithful summary below;
> all concrete numbers/rules preserved.

## 1. Roles
- **Zadávateľ – Firma (B2B):** legal entities + SZČO; billing data (IČO/DIČ/IČ DPH); ad mgmt, bulk applicant selection, payroll-data export.
- **Zadávateľ – Jednotlivec (C2C):** private citizens; no company data; one-off home/garden help.
- **Brigádnik (Worker):** mandatory **KYC**; Wallet, opportunities map, **Brigy coins** account.

## 2. Two modes
- **Short-term (CORE, Escrow):** one-off/operative jobs; **Stripe escrow mandatory**; revenue = % + fixed service fee per transaction.
- **Long-term ("Brigzy Verified" advertising):** listings for long-term/seasonal/stable jobs; **money flows entirely off-platform**; edge = verified profiles (history, XP, ratings); revenue = flat listing fee / subscription packages.

## 3. Legal framework (auto contract selection)
- **B2C firma↔brigádnik:** operational activity = dependent work → **Zmluva o dielo is illegal here.** System generates **DoVP** (result-defined, ≤350 h/yr per employer) or **DoPČ** (repeated activity, ≤10 h/week).
  - **Employer = always the firm, never Brigzy.** Firm must register the worker in Sociálna poisťovňa before work. Brigzy helps by packaging KYC data into an **XML** ready for import into SP eSlužby.
- **C2C jednotlivec↔brigádnik:** **Zmluva o dielo** (§631–643 OZ), only between non-entrepreneurs for tangible-result tasks; no insurance registration; **príležitostný príjem ≤ €500/yr tax-exempt**.
- **Contracts signed in-app** via checkbox + button; each gets an immutable **Audit Log** (IP, timestamp, Device ID, verified phone) → satisfies written form.
  - ⚠️ *Open with lawyer:* research recommended **AdES**; spec relies on checkbox+audit-log (SES). Confirm sufficiency. (C-3)

## 4. Financial architecture (Stripe Connect)
- Funds held by **Stripe Technology Europe, Ltd** (EMI) → **no NBS licence**; Brigzy only sends distribution instructions.
- Escrow lifecycle: **Pending → Cleared**, else **Disputed**.
- **Min payout from Wallet = €15** (micro-transaction pooling).

## 5. Monetization (all fees + **23% VAT**, 2026)
| Fee | Mode | Amount (excl. VAT) | Billed |
|---|---|---|---|
| Service fee | Short-term (escrow) | **€2 fixed + 10%** of job price | on escrow funding |
| Listing fee | Long-term (ads) | **€9–35** (by promotion) | on publish |
| B2B subscription | Long-term (ads) | **€30–99 / month** | monthly |
| Worker Premium | both | **€4.99/mo OR 500 Brigy** | monthly card / coin deduction |

**Premium perks:** ad-free · 15-min head start on new offers · profile highlight badge.

## 6. Brigy coins (in-app loyalty coins) — ⏸️ PARKED (owner: explain later)
> **Owner note (2026-06-03):** Brigy are **just in-app loyalty coins, NOT a € replacement.**
> **Parked** — full mechanics to be explained later; don't design/build around them yet.
> Numbers below are only what v2.5 stated.
- **Conversion used for premium purchases: 100 Brigy = €1** (in-app only).
- **Earn:** +10/worked hour (QR, escrow mode) · +25 for a 5★ rating · +150 for a successful referral · +50/month if monthly avg rating ≥ 4.8★.
- **Spend:** e.g. [Activate Premium for 500 Brigy] → checks balance, deducts 500, activates 30-day Premium.

## 7. Referral (native links, strict anti-fraud)
- Link: `https://brigzy.sk/r/[ID]`; native share sheet.
- **Hard conversion:** reward only after the invited friend **completes + is paid for their first real escrow job** (KYC done first; status Pending→Completed).
- **Reward:** **+150 Brigy to inviter AND +150 to invitee.**
- **Lifetime cap: 600 Brigy** (≈4 conversions); beyond → **+100 XP** only.
- **Anti-fraud:** block reward on matching **IBAN / phone / Device ID**.

## 8. Key UX
- **In-chat price negotiation:** [Navrhnúť novú sumu]; on accept, Stripe authorizes the top-up; **price change invalid until fully covered in escrow.**
- **SOS urgent:** red highlight + priority push to all verified workers within **5 km**.
- **QR attendance:** worker app generates encrypted QR; poster scans for **Check-in/Check-out** (time + GPS) → dispute evidence.

## 9. Safety / reputation / cancellation
- **Insurance (FinExpert Group):** all short-term escrow jobs auto-covered for third-party property damage; claim via app → freeze escrow → broker. *(UNVERIFIED — needs signed partner, C-5.)*
- **Cancellation (legally-aware — no consumer cash penalty):**
  - **Worker no-show / late cancel (<12 h):** **−100 Brigy** + sharp XP/ranking drop + limited offer visibility; **3 absences = permanent ban.**
  - **B2B poster late cancel:** contractually-agreed part of escrow forfeits to the worker as compensation.
  - ⚠️ *Open with lawyer:* is deducting **already-earned loyalty coins** from a consumer enforceable? (vs cash penalty — lower risk, confirm.)

## 10. GDPR / AML
- **rodné číslo:** never at registration; only when selected for the **first B2C dohoda job**.
- **GPS:** legitimate interest (attendance); precise movement history **permanently deleted** after job completion + settlement.
- **AML:** all money via Stripe Connect → **Stripe carries AML + sanctions screening**; Brigzy operates no regulated financial service.
