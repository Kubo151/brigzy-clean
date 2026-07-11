---
title: Legal & Compliance Register — Brigzy.sk
type: register
status: living
updated: 2026-06-07
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
>
> **Update 2026-06-07 — accountant confirmed.** Owner got the combined advisor doc back from the
> **účtovník**; the accounting/tax working conclusions (VAT, escrow accounting, Wallet, reports,
> odvody, registrations) are **confirmed**. Canonical spec is now [[Brigzy-Spec-v2.7]] (supersedes
> v2.5; bakes in the 8 legal fixes + accountant outputs). **The only thing still owed is from the
> lawyer: contract templates (DoVP/DoPČ/ZoD) + selected wordings (splnomocnenie, VOP, GDPR
> consents) + the FinExpert insurance licence question (§186/2009).** None of these block building
> the core. Status legend below: items the accountant confirmed are marked **ACCOUNTANT-CONFIRMED**;
> lawyer-template items stay open but non-blocking.

> **Update 2026-07-08 — lawyer contract templates received + app data map generated.**
> 12 vzory prišli od právnika (`docs/reference/contract-previews/`, dátumované jún 2026,
> "opravená terminológia") — DoVP, DoPČ bežná/sezónna, ZoD, VOP B2B/C2C/Brigádnici,
> Sprostredkovateľská zmluva, DPA Joint Controllers, Privacy Policy, VOP Brigzy,
> terminológia. Owner: **ešte sa môžu meniť**, nebrať ako finálne. Zhoda s appkou:
> poplatky/storno/no-show/KYC/Brigy coins/GPS sedia. **Nesedí (C-12):** všetky 4 zmluvné
> vzory povoľujú podpis len vlastnoručne+foto alebo KEP/eID — appka má mock SMS OTP.
> Ponechané zámerne do finalizácie vzorov (rozhodnutie ownera 2026-07-08). Pri tej
> príležitosti vznikla aj `docs/reference/contract-previews/App-Data-Mapa-2026-07.md` —
> kompletná technická mapa appky (obrazovky/DB/storage/edge fns/subdodávatelia) priamo z
> produkčnej DB, podklad pre C-9 ROPA. Zistilo sa navyše: **čl. 17/20 GDPR (výmaz,
> prenositeľnosť) je v appke len UI mock bez funkčnosti** — `/privacy` tlačidlá nič
> nerobia, a v DB chýba mazací/anonymizačný mechanizmus (väčšina FK na `users.id` je
> `NO ACTION`, nie `CASCADE`). Treba doriešiť pred spracúvaním reálnych dát ostrých
> používateľov.

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
- **Example templates received (2026-06-07):** `docs/reference/Brigzy_Sablony_Zmluv.docx` — all
  three types (DoVP §226, DoPČ §228a, Zmluva o dielo §631 OZ) with placeholders + clauses for
  escrow, OTP/BOK signing (§40(4) OZ), 350h limit, Dodatok, GDPR čl.28. From David, **NOT
  lawyer-verified** — example only. **C-1 stays open** until the advokát signs them off; treat as a
  working draft for the contract generator, not legal truth.

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

### C-12 — E-sign level: checkbox + audit log vs AdES · RESEARCHED → spec'd AdES · MED (lawyer to confirm)
- **v2.7 §3.3 commits to AdES** — SMS/e-mail **OTP** verification at signing (stronger than bare
  SES checkbox), immutable audit log (IP, UTC timestamp, Device ID, doc-version hash, verified
  phone, Stripe account ID), **PDF copy auto-delivered to both parties**, plus a physical-signature
  (BOK scan) alternative. Without a confirmed signature the escrow is not locked. **Open (lawyer):**
  formally confirm AdES+audit-log satisfies §40(4) OZ written form for DoVP/DoPČ.

### C-11 / C-13 — Brigy coins · RESEARCHED (spec'd in v2.7 §7) · HIGH constraint · was ⏸️ PARKED
- **No longer parked** — fully spec'd in v2.7 §7. Brigy = in-app loyalty currency, fixed
  **100 Brigy = 1 €**, usable ONLY for premium services in-app (Premium, topovanie).
- ⚠️ **CRITICAL legal constraint:** Brigy **MUST NOT be convertible to EUR / withdrawable to a
  bank account.** Convertibility would make Brigzy an **electronic-money issuer → EMI licence
  from NBS** (zák. 492/2009 §81). Non-transferable between accounts, no EUR refund right. Must be
  stated in the Brigy coin rules + ToS. Earning/spending engines: see v2.7 §7.1–7.2.
- Replaces the old void **20 % no-show penalty** with a coin/reputation mechanism (see C-6).

### C-6 — Cancellation 20% penalty · RESEARCHED · was MED → now a required change
- **The 20%-of-escrow penalty against a worker-consumer is almost certainly ABSOLUTELY
  VOID** (unfair term §53(4)(k) OZ; court cannot even moderate it — §53(5)). Form contract
  = not individually negotiated. Labour law also disfavors penalties on the employee.
- **Replace with:** reputation/rating + temporary account limits on repeat cancels;
  reimbursement of **provably incurred costs** (not a flat %); symmetric cancellation rules.
  Vs **B2B posters**, a contractual penalty IS permissible (§544 OZ, court moderation §545a).

### C-8 — VAT & invoicing · ACCOUNTANT-CONFIRMED (2026-06-07) · was RESEARCHED/MED
- **Service fee (2 € + 10 %)** = intermediary/electronic service → **base VAT 23 %** (raised
  20→23 % from 1.1.2025). Place of supply §15: B2B SK 23 %; B2B EU → reverse charge + recap
  statement; B2C SK 23 %.
- **VAT registration §4 (from 1.1.2025):** turnover **€50,000/cal-yr** → payer from 1st day
  of next year; **>€62,500** in current year → payer immediately. Late registration fine €60–20,000.
- **Current status:** Renewo (IČO 57476080) is **NOT a VAT payer** (2026-06-03) → no DPH on
  the service fee yet; monitor turnover and register on crossing the threshold.
- **Ads revenue:** 23 % (B2B EU reverse charge; outside EU place outside SK).
- **Invoicing §71–74:** full requirements for B2B (both parties' IČ DPH, etc.).
- **Two-tier service fee (v2.7 §6):** paušál (flat, up to a threshold) + % (above it). Exact
  threshold + rates to be computed pre-MVP from avg job value, Stripe cost (~1.4 %+0.25 €), margin,
  competition. VAT treatment identical (23 % once a payer). Open *business* item, not a legal blocker.

### C-14 — Escrow / Wallet accounting + reports · ACCOUNTANT-CONFIRMED (2026-06-07) · LOW
- **Money flowing through Stripe Connect = pass-through (cudzie prostriedky), NOT Brigzy revenue.**
  Brigzy's only revenue = the service fee. Wallet balances sit on Stripe Connected accounts, not
  on Brigzy's books. Worker PDF income summary + firm CSV/XML export (Pohoda/Kros) are planned
  features; exact field lists per accountant. See v2.7 §5–6, §13 B2/B6/B7. (Closes old C-7 too.)

### C-9 — GDPR · RESEARCHED · HIGH
- **GPS/location:** legitimate interest 6(1)(f) (balancing test) or (b); retain **shortest**
  (days–weeks, not permanent).
- **Device-ID anti-fraud:** legitimate interest 6(1)(f); retain account duration + dispute window.
- **KYC docs:** legal obligation 6(1)(c) (ZP, AML) + (b); payroll/tax 10y; AML 5y.
- **rodné číslo:** 6(1)(c)/(b), §78(4) — only if necessary (collect at DoVP, not registration).
- **Required:** **DPIA** for GPS/anti-fraud (Art 35); balancing tests; **DPA (Art 28)** with
  ALL processors — **Stripe**, maps (Google/Mapbox), cloud/hosting, e-sign, push/SMS;
  **SCC** for non-EU transfers; privacy policy; ROPA; data-subject rights.

### C-5 — Liability insurance (FinExpert / Universal) · UNVERIFIED · MED (lawyer — open)
- v2.7 §10.1 specs an **integration with the Universal (FinExpert Group) system**: opt-out
  checkbox (pre-selected) at job creation → job data auto-sent via API → e-mail confirmation to
  both parties. ⚠️ **Promoting/intermediating insurance may require a financial-agent licence**
  (zák. 186/2009). **Open (lawyer):** confirm whether Brigzy needs registration, or whether merely
  *referring* users to FinExpert (without communicating the product) avoids it. **No build of this
  feature — incl. an investor demo of it — before the lawyer clears it.** Still needs a signed
  partner agreement.

### C-7 — Tax/accounting reports (Pohoda/Kros) · ACCOUNTANT-CONFIRMED (2026-06-07) · folded into C-14
- Worker PDF income summary + firm CSV/XML export are planned features; exact field lists per
  accountant. See C-14 and v2.7 §13 B7.

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

## Still pending (2026-06-07 — narrowed; none block building the core)
**Accountant: done.** Remaining items are all on the **lawyer** (non-blocking):
- Contract templates DoVP/DoPČ/Zmluva o dielo + the auto-classification matrix sign-off (C-1).
- Wordings: intermediary agreement + power of attorney for SP/ZP (C-1), separate B2B/B2C VOP,
  GDPR consents/DPIA/DPA package (C-9), e-sign §40(4) confirmation (C-12).
- **FinExpert insurance licence** question (C-5) — gates only the insurance feature, nothing else.
- Optional/nice-to-have: NBS Inovačný hub written confirmation of the Stripe Connect model (C-2).
