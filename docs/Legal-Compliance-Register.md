---
title: Legal & Compliance Register — Brigzy.sk
type: register
status: living
updated: 2026-06-03
---

# Legal & Compliance Register

> Tracks every legal / tax / payroll / employment-law / insurance / escrow /
> regulatory claim. **Status:** UNVERIFIED · **RESEARCHED** (grounded in cited SK
> statutes via the *Brigzy research Report*, but NOT a substitute for counsel) ·
> VERIFIED (confirmed by the project advokát / daňový poradca / NBS) · CONFLICTING.
>
> **Sources added 2026-06-03:** `Brigzy research Report.docx` (legal rešerš, stav k 6/2026)
> + `Escrow+Inzercia.docx` (business model) + `Platenie odvodov Brigzy.docx` (odvody/registration
> — confirms the model, no contradictions). The research explicitly requires final advokát +
> daňový poradca sign-off (+ optional NBS Inovačný hub) before go-live.

## ✅ Locked strategic decision
**Payment architecture = Stripe Connect; Brigzy NEVER holds user funds.** This single
choice removes the NBS licence requirement (C-2) and most AML duties (C-4). "Everything
through Stripe — escrow and KYC mainly" (owner, 2026-06-03). See [[ADR-0002-escrow-stripe-connect]].

## Items

### C-1 — Worker contract / employment model · RESEARCHED · HIGH (was CRITICAL/CONFLICTING)
- **Finding:** Model is fundamentally sound, with corrections:
  - **B2C (firma ↔ brigádnik) = DoVP (§226 ZP) ONLY for result-defined one-off tasks.**
    For **repeated activity** (čašník, upratovanie, sklad) DoVP is WRONG → must use
    **DoPČ (§228a)** (avg max 10 h/week; seasonal DoPČ max 520 h/yr, 8 months).
  - **C2C (občan ↔ brigádnik) = Zmluva o dielo (§631–643 OZ)** only for a real *dielo*
    (tangible result). Pure *činnosť* with dependent-work signs → risk of disguised employment.
  - **SZČO/živnosť**: clean option (worker invoices, self-handles tax/levies); risk of
    "švarcsystém" if actually dependent work.
  - **Príležitostný príjem** (§8/§9 zák. 595/2003, €500/yr exemption): essentially **NOT
    usable for B2C** (firm can deduct → excluded); only C2C between two non-entrepreneurs.
  - **Both models can run simultaneously**; the app must **auto-assign contract type** by
    *poster type (business vs not) × task nature (result vs activity)*.
- **Risk:** Misusing DoVP for activity = **illegal employment, fine €2,000–200,000**.
  Boundary "dielo vs. závislá práca" / "DoVP vs. DoPČ" is fact-based, decided by
  inšpektorát/court on real performance, not the contract's title.
- **Build impact:** contract generator needs a **type matrix** (DoVP / DoPČ / Zmluva o
  dielo); UX must classify task nature. See [[ADR-0005-employment-contract-model]].
- **Employer at DoVP = ALWAYS the zadávateľ, NEVER Brigzy.** Brigzy = sprostredkovateľ.
  If Brigzy directs/controls work → risk of being deemed employer or **temp-work agency**
  (further licence). Needs an intermediary agreement + power of attorney.
- **Odvody/registration responsibility (confirmed by `Platenie odvodov Brigzy.docx`,
  2026-06-03):** Brigzy **registers nobody and pays no odvody**. The **firm** registers the
  worker (RLFO before work), pays levies, withholds tax. Brigzy *may* assist by
  **auto-generating the SP/ZP XML on one click** from collected data, but legal liability
  stays with the firm. **Pure Zmluva o dielo for everything is NOT allowed** (švarcsystém).
  Implementation: app auto-branches contract type (B2C→DoVP/DoPČ, C2C→Zmluva o dielo) — for
  the user it's one identical click, but the correct document is generated.

### C-2 — Escrow / holding money · RESEARCHED → effectively resolved · was CRITICAL
- **Finding:** Own wallet/escrow ⇒ NBS **payment-institution / EMI licence** (zák. 492/2009).
  **Stripe Connect avoids it**: STEL is an EMI authorized by Central Bank of Ireland
  (ref **C187865**), passported across EEA (PSD2). With Connect, **Stripe holds funds, not
  Brigzy** → no own PSD2 licence/agent status. "Escrow" = **delayed / manual payouts**
  (hold on connected account up to 90 days).
- **Limited-network exemption** does NOT apply (wage payouts ≠ limited goods/services).
- **€15 min payout** is a **business/contractual** choice (not a legal limit) — disclose in ToS.
- **Payout timing** is contractual BUT must respect labour-law due dates (DoVP: after
  completion/handover; DoPČ: by end of next calendar month).
- **Action:** confirm money-flow architecture so Brigzy never holds funds; optional NBS
  Inovačný hub confirmation. See [[ADR-0002-escrow-stripe-connect]].

### C-3 — Digital contracts / e-signature · RESEARCHED · MED
- Checkbox + button **can** preserve written form (§40(4) OZ; SES per eIDAS) but is
  **evidentially weak**. **DoVP requires written form under penalty of invalidity**
  (§226(2)); oral = illegal employment.
- **KEP (qualified) NOT required** (eIDAS Art 25). **Recommendation: at least AdES** +
  robust process — identity verification at onboarding, SMS/email OTP, **audit log**
  (timestamp, IP, doc version), deliver copy to worker.
- **Retention:** payroll/accounting **10y**; mzdové listy **50y**; personal file until
  employee turns **70**. Mostly the zadávateľ's duty; Brigzy (as storage/processor) must
  ensure availability + integrity. See [[ADR-0005-employment-contract-model]].

### C-4 — KYC / AML · RESEARCHED → largely resolved via Stripe · was HIGH
- With **Stripe Connect (Brigzy holds no funds)**: Brigzy is **NOT a "povinná osoba"**
  under §5 zák. 297/2008 → primarily a marketplace; **AML/KYC borne by Stripe** (onboarding
  KYC, sanctions screening, connected-account verification). → KYC is a **real,
  Stripe-provided feature**, not a stub. See [[ADR-0004-kyc-via-stripe]].
- With own wallet: Brigzy becomes a povinná osoba (full CDD + reporting). Avoided by C-2 decision.
- **rodné číslo:** "všeobecne použiteľný identifikátor" (§78(4) zák. 18/2018) — process only
  if necessary. Necessary for DoVP (SP/ZP, payroll, tax): basis 6(1)(c)+(b). **NOT needed at
  registration** → collect **only when a DoVP arises**, never at onboarding. Not Art-9
  sensitive. Publishing it is forbidden.

### C-12 — E-sign level: checkbox + audit log vs AdES · UNVERIFIED · MED (clarify)
- Spec v2.5 relies on **checkbox + button + immutable audit log** (IP, timestamp, Device ID,
  verified phone). Research (C-3) recommended **AdES**. Confirm with lawyer whether the
  audit-log approach is sufficient for DoVP/DoPČ, or AdES is needed. *(in lawyer sheet)*

### C-11 / C-13 — Brigy coins (penalty + VAT/accounting) · ⏸️ PARKED
- Brigy = in-app loyalty coins (not a € replacement). **Parked by owner** — mechanics TBD.
  Revisit coin-related legal/accounting questions only when the owner defines them. Not in
  the current advisor sheets. See [[Feature-Ideas]] IDEA-1.

### C-6 — Cancellation 20% penalty · RESEARCHED · was MED → now a required change
- **The 20%-of-escrow penalty against a worker-consumer is almost certainly ABSOLUTELY
  VOID** (unfair term §53(4)(k) OZ; court cannot even moderate it — §53(5)). Form contract
  = not individually negotiated. Labour law also disfavors penalties on the employee.
- **Replace with:** reputation/rating + temporary account limits on repeat cancels;
  reimbursement of **provably incurred costs** (not a flat %); symmetric cancellation rules.
  Vs **B2B posters**, a contractual penalty IS permissible (§544 OZ, court moderation §545a).

### C-8 — VAT & invoicing · RESEARCHED · MED (daňový poradca to confirm)
- **Service fee (2 € + 10 %)** = intermediary/electronic service → **base VAT 23 %** (raised
  20→23 % from 1.1.2025). Place of supply §15: B2B SK 23 %; B2B EU → reverse charge + recap
  statement; B2C SK 23 %.
- **VAT registration §4 (from 1.1.2025):** turnover **€50,000/cal-yr** → payer from 1st day
  of next year; **>€62,500** in current year → payer immediately. Late registration fine €60–20,000.
- **Current status:** Renewo (IČO 57476080) is **NOT a VAT payer** (2026-06-03) → no DPH on
  the service fee yet; monitor turnover and register on crossing the threshold.
- **Ads revenue:** 23 % (B2B EU reverse charge; outside EU place outside SK).
- **Invoicing §71–74:** full requirements for B2B (both parties' IČ DPH, etc.).

### C-9 — GDPR · RESEARCHED · HIGH
- **GPS/location:** legitimate interest 6(1)(f) (balancing test) or (b); retain **shortest**
  (days–weeks, not permanent).
- **Device-ID anti-fraud:** legitimate interest 6(1)(f); retain account duration + dispute window.
- **KYC docs:** legal obligation 6(1)(c) (ZP, AML) + (b); payroll/tax 10y; AML 5y.
- **rodné číslo:** 6(1)(c)/(b), §78(4) — only if necessary (collect at DoVP, not registration).
- **Required:** **DPIA** for GPS/anti-fraud (Art 35); balancing tests; **DPA (Art 28)** with
  ALL processors — **Stripe**, maps (Google/Mapbox), cloud/hosting, e-sign, push/SMS;
  **SCC** for non-EU transfers; privacy policy; ROPA; data-subject rights.

### C-5 — Liability insurance (FinExpert) · UNVERIFIED · MED
- Not addressed by the research. Unchanged: needs a signed partner agreement; treat as
  Future; no MVP feature may depend on it.

### C-7 — Tax/accounting reports (Pohoda/Kros) · UNVERIFIED → see accountant
- Covered by [[Accountant-Questions-SK]]; pending daňový poradca.

### C-10 — Czech-market parity · UNVERIFIED · MED
- Not addressed; do not assume SK = CZ. Future expansion.

### C-DEMO — Demo posture · RESEARCHED → confirmed safe
- Demo **without real money + without real work** = **no licensing/labour risk** (Stripe
  test mode + fictitious data). **BUT:** if the beta processes **real personal data** of real
  users, **GDPR applies fully** (privacy policy, DPA, legal basis). If it enables real
  payments/contracts, it's no longer a demo and all duties activate. Investor messaging must
  not be misleading ("demo/concept", not a licensed payment service).

## Recommended sequence (from the research report)
1. **Now:** lock Stripe Connect (Brigzy never holds money) ✅; freeze own-wallet plan;
   remove the 20 % penalty from ToS.
2. **With lawyer:** contract-type matrix + templates; intermediary agreement + power of
   attorney; e-sign level (AdES + audit log); GDPR package (DPIA, balancing, ROPA, DPA, SCC).
3. **With daňový poradca:** VAT (23 %, registration thresholds, invoicing, possible OSS).
4. **Before launch:** optional NBS Inovačný hub confirmation; implement **350h-per-employer
   counter** + limit warnings.

## Still pending (do not treat RESEARCHED as final)
Final advokát opinion on the contract matrix + intermediary/PoA model; daňový poradca on
VAT/OSS; NBS confirmation that Stripe Connect setup needs no licence; insurance partner (C-5).
