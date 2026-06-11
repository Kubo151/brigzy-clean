---
title: UX Spec — Navigation, IA & Screen Inventory — Brigzy.sk
type: design
status: complete (B1–B5 + Part C; S9 paused pending FinExpert; audit fixes applied — see Spec-Audit-2026-06-11)
version: target spec v2.7
updated: 2026-06-12
---

# UX Spec — Brigzy.sk (screen-by-screen)

> Master UX plan for the **full rebuild** (target [[Brigzy-Spec-v2.7]]). Built top-down:
> **Part A = navigation & information architecture + complete screen inventory** (this skeleton),
> then **Part B = per-screen detail** (purpose, contents, functions, states) flow by flow.
> Visual language = claymorphism (Purple Clay light / Dark Clay dark) per [[Design-System]].
> Where a UX decision is the owner's to make, it's flagged **❓DECISION**.

---

## A0. Roles & how one account maps to them

v2.7 §1.1 has **three role-views**: **Brigádnik (Worker)**, **Zadávateľ – Firma (B2B)**,
**Zadávateľ – Jednotlivec (C2C)**. Proposed account model:

- **One account, two hats.** A user can be a **Worker** and/or a **Poster**. A persistent
  **role switcher** (top-left avatar menu or a segmented control) flips the whole shell. State
  already exists (`app-store.currentRole`).
- **B2B vs C2C is a property of the Poster hat, not a third login.** If the poster fills in
  **company details (IČO/DIČ/IČ DPH)** → **B2B** shell (invoicing, mzdové podklady export, bulk
  select). If not → **C2C** shell (individual, Zmluva o dielo only, simplified). The contract
  matrix (v2.7 §3) keys off exactly this poster-type × task-nature.
- **First run** asks the primary intent ("Chcem si zarobiť" / "Chcem niekoho najať") to pick the
  starting shell; the other hat can be added later from Profile.

> ❓DECISION-1: confirm the "one account, switchable Worker/Poster; B2B vs C2C by company-details"
> model — vs. separate accounts per role. (Recommendation: one account, switchable.)

---

## A1. Global patterns (apply across all shells)

- **Session gate** (`src/app/index.tsx`): splash → if session → role home; else → auth.
- **Bottom tab bar**: custom glass `FloatingTabBar` (already built), 5 tabs, role-dependent set.
- **Primary create action**: center FAB on the Poster shell ("+ Pridať brigádu"); Workers have no
  create button.
- **Notifications**: bell icon in every header → Notifications screen; push deep-links into the
  relevant screen (new nearby job, application accepted, escrow event, message, contract to sign,
  review request, payout, SOS).
- **Money formatting**: integer cents → "12,50 €"; Brigy shown as coins with the 100:1 hint.
- **Empty / loading / error / offline** states are a required variant for every list & data screen.
- **Sheets over navigation** for short actions (confirm escrow, propose price, sign, report).
- **Language**: SK default, EN available (one i18n system — consolidate per CLAUDE.md gotcha).

---

## A2. Entry & Auth (shared, role-agnostic)

| # | Screen | Purpose (one-liner) |
|---|--------|---------------------|
| E1 | **Splash / Session gate** | Brand splash; route to shell or auth. |
| E2 | **Onboarding carousel** | 3–4 value slides (find work / get paid safely via escrow / trust & reviews). Skippable. |
| E3 | **Intent pick** | "Zarobiť si" (Worker) vs "Najať" (Poster) → seeds starting shell (A0). |
| E4 | **Register** | email + password (+ Apple/Google later); phone number. |
| E5 | **Login** | email/password; link to reset. |
| E6 | **Phone OTP verify** | SMS OTP — needed for the AdES audit trail (v2.7 §3.3). |
| E7 | **Forgot / reset password** | email reset flow. |
| E8 | **Email verify (interstitial)** | optional gate depending on Supabase settings. |

---

## A3. WORKER shell (Brigádnik)

**Tabs:** `Domov/Mapa` · `Moje brigády` · `Chat` · `Peňaženka` · `Profil`

### Discovery
| # | Screen | Purpose |
|---|--------|---------|
| W1 | **Home / Map** | Interactive map of nearby jobs (pins by GPS), radius filter 5/15/30 km, SOS jobs highlighted red. |
| W2 | **Job list / search** | List+search view of the same feed; filters (category, pay, distance, mode). |
| W3 | **Job detail** | Full job: pay, type, location, slots, poster mini-profile + rating, contract type that will apply, insurance note → **Apply**. |
| W4 | **Filters sheet** | Category, pay range, radius, short-term vs long-term (Verified). |

### My work
| # | Screen | Purpose |
|---|--------|---------|
| W5 | **My jobs (tabs)** | Applications (pending) · Active (escrow/in-progress) · Completed. |
| W6 | **Booking detail (Worker)** | The hub for one engagement: status, contract, escrow state, QR check-in/out, "+ práca navyše" addendum prompts, complete → review. |
| W7 | **Active job / QR check-in** | Generate dynamic QR for poster to scan; show worked-time + earned-Brigy ticker. |

### Money
| # | Screen | Purpose |
|---|--------|---------|
| W8 | **Wallet** | Balance (Stripe-backed), ledger history, **Withdraw** (≥15 €), income PDF export. |
| W9 | **Withdraw / payout** | Choose amount/IBAN → SEPA payout (real later; test now). |
| W10 | **Stripe Connect onboarding** | Express onboarding to receive money + Connect KYC (v2.7 §4 layer 1). |
| W11 | **Income report (PDF)** | Per-period summary for tax return (employer, gross, withheld, period). |

### Profile / trust / gamification
| # | Screen | Purpose |
|---|--------|---------|
| W12 | **Profile (own)** | Avatar, XP/rank, badges, ratings, Brigzy Verified status, role switch, add Poster hat. |
| W13 | **Public profile (as seen by posters)** | Verified badge, work history, stars — the "Brigzy Verified" surface (v2.7 §2.2). |
| W14 | **Brigy wallet** | Coin balance, earning history, spend (Premium/topovanie). Non-convertible note. |
| W15 | **Referral** | Share link, invited list + status, 600-coin cap progress. |
| W16 | **Premium** | Benefits (ad-free, 15-min head start, badge), 4,99 €/mo or 500 Brigy. |
| W17 | **KYC — payroll details** | Own Brigzy form (rodné číslo, ZP, address, IBAN) — appears **only at first DoVP**, not here by default. |

---

## A4. POSTER shell (B2B firma & C2C jednotlivec)

**Tabs:** `Prehľad` · `Moje brigády` · `Chat` · `Peňaženka/Fakturácia` · `Profil`
**Center FAB:** `+ Pridať brigádu`

### Create & manage jobs
| # | Screen | Purpose |
|---|--------|---------|
| P1 | **Dashboard** | Active jobs at a glance, applicants waiting, escrow held, 350h warnings (B2B), quick post. |
| P2 | **Post a job — wizard** | Category → describe → pay (with auto fee preview) → location → slots → **SOS toggle** → insurance opt-out checkbox → schedule. Auto-derives contract type. |
| P3 | **Job detail (Poster)** | Manage one listing: applicants, slots filled, edit/close, group chat (multi-slot). |
| P4 | **Applicants list** | Ranked applicants (XP/rating/verified); **select** (B2B bulk-select) → triggers booking+escrow. |
| P5 | **Booking detail (Poster)** | One engagement: contract to sign, escrow fund/release, **scan worker QR**, "+ práca navyše", approve work → release → review. |
| P6 | **Cross-sell prompt** | "Zadať ďalšiu brigádu tomuto brigádnikovi?" → re-hire via escrow (v2.7 §9.5). |

### Money / billing
| # | Screen | Purpose |
|---|--------|---------|
| P7 | **Escrow / payments** | Funds held per booking, fund/refund/release; card or invoice. |
| P8 | **Invoices (B2B)** | Service-fee invoices (no VAT now / 23% after registration), export. |
| P9 | **Mzdové podklady export (B2B)** | CSV/XML for Pohoda/Kros; RLFO/SP/ZP XML one-click (under PoA). |

### Profile
| # | Screen | Purpose |
|---|--------|---------|
| P10 | **Company profile (B2B)** | IČO/DIČ/IČ DPH, billing address, managers (multi = later). |
| P11 | **Individual profile (C2C)** | Name, rating as poster, history; no company fields. |

---

## A5. Shared cross-role flows (reused screens / sheets)

| # | Screen | Used by | Purpose |
|---|--------|---------|---------|
| S1 | **Chat (1:1 / group)** | all | Messaging; realtime; group chat for multi-slot. |
| S2 | **Price negotiation sheet** | Worker↔Poster | Counter-offer sadzby → accept/reject → escrow recompute (v2.7 §9.1). |
| S3 | **Contract preview + sign** | both parties | Full contract text → **OTP (AdES)** or **BOK scan** → PDF to both; blocks until signed (v2.7 §3.3). |
| S4 | **Dodatok (addendum) sheet** | both parties | "+ práca navyše": description+amount → accept → extra escrow → auto Dodatok → sign. |
| S5 | **Escrow confirm sheet** | Poster | Fund the hold (card/invoice) → Pending. |
| S6 | **QR scan (Poster) / show (Worker)** | both | Check-in/out attendance, GPS+time stamp. |
| S7 | **Blind review** | both | Two-way rating, revealed only when both submit. |
| S8 | **Report a problem / dispute** | both | Freeze escrow → Disputed → support. |
| S9 | **Insurance opt-out + claim** | both | FinExpert checkbox at create; claim flow (⚠️ gated by C-5 licence). |
| S10 | **Notifications** | all | Event feed + deep links. |
| S11 | **Support chat (non-AI)** | all | Contact/support (AI bot later). |
| S12 | **Settings** | all | Language, theme, notifications, legal (VOP/Privacy), logout, delete account (GDPR). |

---

## A6. The critical escrow loop (end-to-end screen sequence)

This is the spine the whole product hangs on — both roles, one timeline:

```
Worker: W1/W3 Apply ─▶ S1 Chat ─▶ S2 Negotiate price
                                       │
Poster: P4 Applicants ── select ──────▶ S5 Escrow confirm (Pending) ─▶ S3 Contract sign (both, OTP/BOK)
                                                                              │  (350h check; KYC payroll form on first DoVP)
                                                          ┌───────────────────┘
                                              Work day: W7 show QR ⇄ S6 Poster scans (check-in/out)
                                                          │  (optional S4 Dodatok = extra work)
                                              Poster approves ─▶ release escrow (Cleared) ─▶ W8 Wallet credit (− fee)
                                                          │
                                              S7 Blind review (both) ─▶ W9 Withdraw (≥15 €)  /  P6 Cross-sell
```

---

## A7. UX decisions — RESOLVED (2026-06-07)

- **DECISION-1 ✅** — **one account, switchable Worker/Poster**; B2B vs C2C by company details (A0).
- **DECISION-2 ✅ (default)** — Stripe Connect onboarding is **lazy**: prompted before a worker can
  be *selected*/paid (gate on apply→selectable), not at signup. Reduces signup friction.
- **DECISION-3 ✅** — **long-term "Brigzy Verified" inzertný mode is IN** this rebuild.
- **DECISION-4 ✅** — **Brigy + Premium + Referral are IN** this rebuild.
- **DECISION-5 ✅** — **insurance (FinExpert) UI is IN, behind a feature flag** (opt-out checkbox +
  claim), shipped dark until the C-5 licence question is cleared by the lawyer.

→ Full v2.7 scope is in. Per-screen detail below covers all of it.

---

# Part B — Per-screen detail

> Format per screen: **Účel · Obsah/layout · Funkcie (akcie) · Dáta (tables) · Stavy · Spec/legal ref**.
> Order: **B1 Entry/Auth → B2 Worker → B3 Poster → B4 Shared sheets → B5 Gamification/long-term.**
> Done: **B1 + B2 + B3 + B4 (S9 ⏸ FinExpert) + B5 + Part C** — spec kompletný (2026-06-11).
> Známe nálezy/opravy: [[Spec-Audit-2026-06-11]].

## B1. Entry & Auth

### E1 — Splash / Session gate
- **Účel:** brand moment + route. **Obsah:** logo on clay bg, spinner.
- **Funkcie:** read Supabase session → has session ? route to last `currentRole` shell : E2/E5.
- **Dáta:** `supabase.auth`, `app-store.currentRole`. **Stavy:** loading only; on auth error → E5.

### E2 — Onboarding carousel
- **Účel:** sell the value in 3–4 slides (nájdi prácu blízko · zaplatené bezpečne cez escrow ·
  dôvera: KYC + recenzie + XP). **Obsah:** swipeable slides, dots, Skip/Ďalej, CTA „Začať".
- **Funkcie:** Skip/finish → E3. **Dáta:** local flag „seen onboarding". **Stavy:** —.

### E3 — Intent pick
- **Účel:** pick starting shell. **Obsah:** two big clay cards „Chcem si zarobiť" (Worker) /
  „Chcem niekoho najať" (Poster). **Funkcie:** select → set `currentRole` → E4 register.
- **Dáta:** `app-store.currentRole`, role-selection flag. **Stavy:** —.

### E4 — Register
- **Účel:** create account. **Obsah:** email, password, phone, VOP/Privacy consent checkbox(es).
- **Funkcie:** validate → `auth-store.signUp` → create `users` row (in login.tsx pattern) → E6 OTP.
- **Dáta:** `users`. **Stavy:** field errors (Slovak), email-taken, weak-password, network.
- **Legal:** granular consents (GDPR); store consent version + timestamp.

### E5 — Login
- **Účel:** sign in. **Obsah:** email, password, „Zabudnuté heslo?", link to register.
- **Funkcie:** `auth-store.signIn` → route to shell. **Stavy:** wrong-credentials, unverified, network.

### E6 — Phone OTP verify
- **Účel:** verified phone for the **AdES audit trail** (v2.7 §3.3) + anti-fraud. **Obsah:** phone +
  6-digit OTP input, resend timer. **Funkcie:** send/verify OTP → mark phone verified.
- **Dáta:** `users.phone`, verified flag. **Stavy:** wrong/expired code, resend cooldown.

### E7 — Forgot / reset password
- **Účel:** recover. **Obsah:** email → "sent" → deep-link to new-password. **Stavy:** unknown email (generic msg), expired link.

### E8 — Email verify (interstitial)
- **Účel:** optional email confirmation per Supabase settings. **Funkcie:** resend, "I confirmed → continue".

## B2. Worker shell (Brigádnik)

### W1 — Home / Map
- **Účel:** discover nearby jobs spatially. **Obsah:** map (GPS-centered) with job pins, radius
  control 5/15/30 km, SOS jobs red + pulsing, category chips, top search bar, "list view" toggle,
  Premium "15-min náskok" hint for non-premium. Notifications bell.
- **Funkcie:** pan/zoom; tap pin → mini-card → W3; change radius → refetch; toggle → W2; search → W2.
- **Dáta:** `jobs` (lat/lng bbox + Haversine), `users` geo permission. **Stavy:** no-jobs-in-radius
  (suggest widening), location-denied (fallback to city picker), loading skeletons, offline cache.
- **Ref:** v2.7 §9.2; map = Leaflet/OSM now, Google/Mapbox option (Architecture-Proposal).

### W2 — Job list / search
- **Účel:** scan/search the same feed as a list. **Obsah:** search field, filter button (→W4),
  sort (distance/pay/newest), job cards (title, pay, distance, category, SOS/Verified badges).
- **Funkcie:** search, open filters, infinite scroll, tap card → W3, save/bookmark.
- **Dáta:** `jobs`, `saved_jobs`. **Stavy:** empty-search, no-results, loading, error-retry.

### W3 — Job detail
- **Účel:** decide & apply. **Obsah:** title, poster mini-profile (rating, verified, B2B/C2C),
  pay (+ derived fee transparency), type, location/map snippet, duration/schedule, slots left,
  **contract type that will apply** (DoVP/DoPČ/ZoD) explained, insurance note, SOS flag.
- **Funkcie:** **Prihlásiť sa (Apply)** → creates `applications` (+ opens S1 chat); save; share;
  report listing. If not Connect-onboarded, applying is fine; onboarding gated later (DECISION-2).
- **Dáta:** `jobs`, `users` (poster), `applications`. **Stavy:** slots-full, already-applied,
  closed/expired, own-job (hide apply).
- **Ref:** v2.7 §3 (contract type shown), §2.1.

### W4 — Filters sheet
- **Účel:** narrow feed. **Obsah:** category multi-select, pay range, radius, mode (krátkodobý /
  dlhodobý Verified), schedule. **Funkcie:** apply/reset → updates W1/W2. **Dáta:** query params.

### W5 — My jobs (tabbed)
- **Účel:** worker's engagement hub. **Obsah:** 3 tabs — **Prihlášky** (pending applications) ·
  **Aktívne** (escrow_pending/in_progress) · **Hotové** (completed/cleared). Cards show status pill,
  next action ("Podpíš zmluvu", "Check-in", "Ohodnoť").
- **Funkcie:** tap → W6; withdraw application; filter. **Dáta:** `applications`, `bookings`.
- **Stavy:** empty per tab (CTA „Nájdi brigádu" → W1), loading, error.

### W6 — Booking detail (Worker) ⭐ hub
- **Účel:** run one engagement end-to-end. **Obsah:** status timeline (applied → selected →
  signed → in progress → completed → cleared), poster card + chat shortcut, contract card
  (view/sign), escrow state badge, **QR check-in/out** entry, **"+ práca navyše"** addendum prompts
  when poster requests, agreed amount + fee + net, completion → review CTA.
- **Funkcie:** open chat (S1), negotiate (S2), **sign contract (S3)**, show QR (W7/S6), accept
  Dodatok (S4), mark/confirm completion, open review (S7), report/dispute (S8).
- **Dáta:** `bookings`, `contracts`, `escrow_transactions`, `attendance_events`, `contract_addendums`.
- **Stavy:** awaiting-poster-funding, awaiting-signature (blocking banner) — v tomto poradí
  (fund → sign), in-progress, disputed, cancelled, completed-awaiting-review. **Ref:** the spine in A6.

### W7 — Active job / QR check-in
- **Účel:** prove attendance + watch earnings. **Obsah:** big dynamic **QR** (rotating nonce),
  check-in/out state, live worked-time + **Brigy ticker (+10/h)**, location note, poster contact.
- **Funkcie:** generate/refresh QR; poster scans (S6) → check-in then check-out; SOS contact.
- **Dáta:** `attendance_events`, `work_hours_counters`, `brigy_ledger`. **Stavy:** not-checked-in,
  checked-in (timer running), checked-out (summary), GPS-off warning. **Ref:** v2.7 §9.4, §7.1.

### W8 — Wallet
- **Účel:** see & move money. **Obsah:** available balance (Stripe-backed), pending escrow, ledger
  list (credits/fees/payouts), **Vybrať (≥15 €)** CTA, income-report export.
- **Funkcie:** → W9 withdraw; → W11 PDF; filter ledger; → W10 if not Connect-onboarded.
- **Dáta:** `wallet_ledger` (derived balance), `escrow_transactions`, `payouts`. **Stavy:**
  zero-balance, below-15 (disabled withdraw + hint), onboarding-required, loading. **Ref:** v2.7 §5.

### W9 — Withdraw / payout
- **Účel:** cash out. **Obsah:** amount (≥15 €), IBAN/connected account, fee/ETA note, confirm.
- **Funkcie:** request payout → `payouts` (Stripe Transfer→payout; test now). **Stavy:**
  below-min, no-IBAN (→W10), in-progress, failed-retry. **Ref:** §5, C-2.

### W10 — Stripe Connect onboarding
- **Účel:** enable receiving money + Connect KYC (layer 1). **Obsah:** explainer → Stripe-hosted
  onboarding (webview/redirect) → return status. **Funkcie:** start/refresh onboarding link.
- **Dáta:** `users.stripe_account_id`, `kyc_status`. **Stavy:** not-started, pending, restricted
  (needs more info), verified. **Ref:** v2.7 §4 layer 1; ADR-0004.

### W11 — Income report (PDF)
- **Účel:** tax-return backup. **Obsah:** period picker → preview (per employer: IČO, gross,
  withheld tax, levies, period, contract no.) → export/share PDF. **Dáta:** `bookings`, `contracts`,
  ledger. **Stavy:** no-income-in-period. **Ref:** v2.7 §13 B7 (accountant to finalize fields).

### W12 — Profile (own)
- **Účel:** identity + control center. **Obsah:** avatar, name, XP/rank, badges, rating summary,
  **Brigzy Verified** status, **role switch** (Worker↔Poster), "Pridať klobúk" (add Poster),
  edit profile, settings entry. **Funkcie:** edit, switch role, open W13/W14/W15/W16, settings (S12).
- **Dáta:** `users`, `xp_events`, `badges/user_badges`, `reviews`. **Stavy:** incomplete-profile nudge.

### W13 — Public profile (poster's view)
- **Účel:** the trust surface posters see. **Obsah:** verified badge, work history count, ★ rating,
  XP/rank, badges, reviews. **Funkcie:** (read-only externally). **Ref:** v2.7 §2.2 Brigzy Verified.

### W14 — Brigy wallet
- **Účel:** loyalty coins. **Obsah:** coin balance + "≈ X €" hint, earning history, spend options
  (Premium 500, topovanie, badges), **non-convertible** disclaimer. **Funkcie:** spend → W16/topup.
- **Dáta:** `brigy_ledger`. **Stavy:** zero, insufficient-for-item. **Ref:** v2.7 §7; ⚠️ no EUR payout (C-11/13).

### W15 — Referral
- **Účel:** invite & earn. **Obsah:** unique link, native share, invited list + status
  (pending/converted/blocked), **600-coin cap** progress. **Funkcie:** share; copy.
- **Dáta:** `referrals`, `brigy_ledger`. **Stavy:** cap-reached (XP-only note), anti-fraud-blocked. **Ref:** §8.

### W16 — Premium
- **Účel:** upsell. **Obsah:** benefits (ad-free, 15-min náskok, profile boost), price 4,99 €/mo
  **alebo 500 Brigy**, current status. **Funkcie:** subscribe (card) / pay with Brigy; manage.
- **Dáta:** premium entitlement, `brigy_ledger`. **Stavy:** active/expired. **Ref:** §6.

### W17 — KYC payroll details (just-in-time)
- **Účel:** collect SP/ZP data **only at first DoVP/DoPČ** (never at registration). **Obsah:** form —
  rodné číslo, zdravotná poisťovňa (VšZP/Dôvera/Union), trvalý pobyt, IBAN; GDPR consent to transfer
  to the employer. **Funkcie:** save (encrypted) → unblocks contract generation.
- **Dáta:** `contracts.payload_json` (encrypted). **Stavy:** validation (r.č. format), consent-required.
- **Ref:** v2.7 §4; legal C-4/C-9 (§78(4) z.18/2018) — minimization, just-in-time.

---

## B3. Poster shell (Zadávateľ — B2B firma & C2C jednotlivec)

> B2B/C2C differences are called out inline. B2B = poster filled in IČO/company details;
> C2C = individual without company. The contract matrix keys off this (v2.7 §3).

### P1 — Dashboard

- **Účel:** Poster's home — at-a-glance health of all active jobs, pending actions, escrow
  held, and 350h warnings (B2B). Fast path to post a new job.
- **Obsah/layout:** Top summary strip — `N aktívnych brigád` · `N čakajúcich uchádzačov` ·
  `X € držané v escrow`; below: job cards (title, slots filled/total, status pill, applicant
  badge if new); **B2B only:** amber warning banner per employer-worker pair approaching 315 h
  (`"S [Meno] máte 318/350 h — zvážte DoPČ"`); center FAB `+ Pridať brigádu`.
  Notifications bell top-right.
- **Funkcie:** tap job card → P3; tap applicant badge → P4; tap escrow strip → P7;
  tap warning banner → P4 (filtered to that worker); FAB → P2.
- **Dáta:** `jobs` (poster_id = me, status active/draft), `applications` (count pending),
  `escrow_transactions` (sum held), `work_hours_counters` (total_hours ≥ 315, B2B only).
- **Stavy:** empty (no jobs yet — large CTA card "Zadaj svoju prvú brigádu" → P2); loading
  skeletons; all-slots-filled jobs dimmed; expired jobs collapsed to "Archív" section.
- **Ref:** v2.7 §3.4 (350h warning at 315h), §5 (escrow overview), §9.

---

### P2 — Post a job — wizard

- **Účel:** Create a new job listing. Auto-derives contract type so the poster never has to
  pick DoVP vs DoPČ vs Zmluva o dielo themselves — they just describe the task.
- **Obsah/layout:** 7-step wizard with a progress bar and back/next nav:
  1. **Kategória** — icon grid of job categories (upratovanie, sklad, gastro, stavba, IT,
     ostatné…). Selection feeds into contract-type derivation.
  2. **Popis úlohy** — title (max 60 chars), description, and a two-option toggle:
     **Výsledok** (deliver a defined result) vs **Činnosť** (ongoing activity / repeated work).
     This is the single key signal for DoVP vs DoPČ (B2B).
  3. **Odmena** — hourly rate or fixed amount; real-time fee preview panel showing
     gross → service fee (Pásmo 1 flat / Pásmo 2 %) → worker net (v2.7 §6 two-tier).
  4. **Miesto** — map pin pick or address search; optional "remote / online" toggle.
  5. **Počet miest & rozvrh** — slot count (1–N); date/time start + estimated duration;
     recurring toggle (daily/weekly, for DoPČ). Slot count > 1 enables multi-slot group mode.
  6. **Nastavenia** — SOS toggle (urgent, red badge, higher visibility); insurance opt-out
     checkbox (pre-checked, label "Chcem poistenie cez FinExpert" — `⚠️ hidden by feature
     flag C-5 until lawyer clears`); visibility (public / invite-only).
  7. **Súhrn & publikovanie** — full preview of the listing with the **auto-derived contract
     type** shown prominently (`"Zmluva: DoVP (§226 ZP)"` / `"DoPČ (§228a ZP)"` /
     `"Zmluva o dielo (§631 OZ)"`), fee preview, confirm CTA.
- **Contract-type derivation logic (auto, never shown as a user choice):**
  - poster = B2B + result → **DoVP §226**
  - poster = B2B + activity/repeated → **DoPČ §228a**
  - poster = C2C → **Zmluva o dielo §631–643 OZ** (regardless of task nature)
- **Funkcie:** draft auto-save after each step; back without data loss; publish → creates
  `jobs` row (status = `active`) + triggers P3; edit draft → re-enter wizard at step N.
- **Dáta:** `jobs`, `users` (poster type B2B/C2C from company details).
- **Stavy:** field validation per step (max chars, pay range sanity check, date in future);
  draft-saved indicator; publish-failed (network) with retry; 350h pre-check on publish
  (B2B: if adding a DoVP for a worker already at 350h on this pair → block + suggest DoPČ,
  but this check is at selection time P4, not here).
- **Ref:** v2.7 §3 (contract matrix), §6 (two-tier fee), §9.2 (SOS), §9.3 (multi-slot),
  §10.1 (insurance ⚠️ C-5 licence gate); C-1 (contract type auto-assignment).

---

### P3 — Job detail (Poster)

- **Účel:** Manage one active listing — see who applied, track slots, edit or close.
- **Obsah/layout:** Header (job title, status pill, `N/M miest obsadených`); two tabs:
  **Uchádzači** (count badge, shortcut → P4) and **Rezervácie** (list of confirmed bookings
  → P5); action bar: Edit · Boost (Brigy topovanie) · Close/Archive; for multi-slot jobs
  a **Group chat** button (S1) appears once ≥2 slots filled; insurance status note (if opted
  in, ⚠️ C-5 flag).
- **Funkcie:** → P4 (applicants); → P5 (individual booking); Edit → P2 wizard pre-filled
  (limited fields editable after first booking); Boost → spend Brigy for visibility; Close →
  confirm sheet → status = `closed`, refund pending escrow; Group chat → S1.
- **Dáta:** `jobs`, `applications`, `bookings`.
- **Stavy:** no-applicants-yet (share prompt with copy link + native share); all-slots-filled
  (applicant tab disabled, "Všetky miesta obsadené"); closed (read-only banner); expired
  (auto-closed, show re-post CTA).
- **Ref:** v2.7 §9.3 (multi-slot, group chat), §7 (Brigy topovanie).

---

### P4 — Applicants list

- **Účel:** Browse, compare, and select workers for a job slot. The moment a poster selects
  a worker, a booking is created and escrow funding is triggered.
- **Obsah/layout:** Ranked list of applicants — each card: avatar, name, ★ rating,
  XP rank badge, **Brigzy Verified** tick (if applicable), short bio snippet, applied-at
  timestamp, chat preview (last message). Sort: recommended (XP + rating + verified) /
  newest / pay preference.
  **B2B multi-slot:** checkboxes on each card → select up to `slot_count` workers →
  **"Vybrať N uchádzačov"** batch CTA at bottom.
  **C2C / single slot:** single tap-to-select.
  **350h gate (B2B):** if selecting a worker would push a DoVP pair over 350h → block with
  inline error `"S týmto brigádnikom ste na 348/350 h — na ďalší DoVP nemáte kapacitu.
  Zvážte DoPČ."` with a "Zmeniť typ" suggestion.
- **Funkcie:** tap worker name/avatar → W13 (public profile, read-only); tap chat icon → S1
  (existing thread); **select/bulk-select** → create `bookings` rows + open S5 (escrow fund
  sheet); reject (soft — removes from view, no notification to worker); message shortcut.
- **Dáta:** `applications`, `users`, `reviews` (avg rating), `bookings`,
  `work_hours_counters` (350h gate, B2B).
- **Stavy:** empty (no applications — share job prompt); all-rejected (re-open prompt);
  selection-in-progress (batch counter chip); 350h-blocked inline (not a modal, inline on
  the card); loading (skeleton cards).
- **Ref:** v2.7 §3.4 (350h counter — warn 315h, block at 350h), §4 (KYC status visible as
  badge), §2.2 (Brigzy Verified badge).

---

### P5 — Booking detail (Poster) ⭐ hub

- **Účel:** Run one engagement end-to-end as the poster — fund escrow, co-sign contract,
  scan QR at work, release payment, review. The mirror of W6.
- **Obsah/layout:** Status timeline at top (5 states: `Vybraný → Financovaný → Podpísaný →
  Prebieha → Dokončený`); worker card (avatar, name, rating, chat shortcut); below, action
  cards that appear/disappear based on current state:
  - **Escrow card** — amount held, status (Pending / Cleared / Disputed), "Financovať"
    CTA (→ S5) or "Uvoľniť platbu" CTA when work approved.
  - **Zmluva card** — contract type, "Zobraziť zmluvu" + sign status for both parties;
    "Podpísať" CTA (→ S3) when unsigned.
  - **Dochádzka card** — "Skenovať QR brigádnika" (→ S6) for check-in and check-out;
    shows timestamps once scanned.
  - **"+ Práca navyše" button** — active during `in_progress`; triggers Dodatok flow (→ S4).
  - **Dokončiť prácu CTA** — appears after check-out; "Potvrdiť dokončenie" → releases
    escrow (Cleared) → S7 review prompt → P6 cross-sell prompt.
  - **Disputed banner** — if S8 dispute raised, freezes all CTAs, shows support contact.
- **Funkcie:** fund escrow (S5); sign contract (S3); scan QR (S6); add Dodatok (S4);
  approve & release escrow; open review (S7); raise dispute (S8); open chat (S1).
- **Dáta:** `bookings`, `contracts`, `escrow_transactions`, `attendance_events`,
  `contract_addendums`.
- **Stavy:** awaiting-funding (escrow card highlighted, others locked); awaiting-signatures
  (contract card highlighted); in-progress (QR card active, + práca navyše visible);
  dodatok-pending (extra escrow card for the addendum); awaiting-poster-approval (release
  CTA highlighted); disputed (frozen, support banner); completed (all cards collapsed,
  cross-sell prompt shown as sticky banner).
- **Ref:** v2.7 §5 (escrow state machine Pending→Cleared→Disputed); §3.3 (contract + OTP
  sign); §9.4 (QR attendance); §9.6 (Dodatok — cannot change contract type, hours roll into
  350h counter); C-3/C-12 (AdES signing).

---

### P6 — Cross-sell prompt

- **Účel:** Immediately after a booking completes, offer the poster to re-hire the same
  worker — reducing churn and locking in the next job while satisfaction is peak.
- **Obsah/layout:** Sticky bottom sheet (auto-shown after escrow release + review submit):
  worker avatar + name + ★ rating just earned; headline `"Páčil sa ti [Meno]? Pridaj mu
  ďalšiu brigádu!"` ; two CTAs: **"Zadať znovu"** (re-hire same worker, pre-fills P2 with
  same category + location, skips applicants step) and **"Nová brigáda"** (blank P2);
  dismiss X.
- **Funkcie:** "Zadať znovu" → creates a new `jobs` row (status = `pending_worker_accept`)
  linked to the previous booking via `parent_booking_id`; worker gets a notification with
  direct accept CTA; → P5 for new booking; dismiss → stays on P5 completed view.
  "Nová brigáda" → P2 wizard blank.
- **Dáta:** `bookings` (`parent_booking_id` FK for cross-sell chain), `jobs`, `users`.
- **Stavy:** only shown once per completed booking (localStorage flag prevents re-show);
  worker-deactivated edge case (CTA hidden, "Brigádnik momentálne nie je dostupný").
- **Ref:** v2.7 §9.5 (cross-sell re-hire via escrow); each re-hire = new DoVP/DoPČ, 350h
  counter continues accumulating.

---

### P7 — Escrow / payments

- **Účel:** Financial overview for the poster — all escrow positions across all bookings,
  fund / refund actions, card management.
- **Obsah/layout:** Summary banner (total held in escrow across all bookings); below: tabs
  **Aktívne** (funded, in-progress) · **Dokončené** (cleared, paid out) · **Spory**
  (disputed); each booking row: worker name, job title, amount, status pill, action button.
  Bottom: **"Pridať kartu"** / "Spravovať platobné metódy" (Stripe Payment Methods).
  **B2B only:** "Platiť faktúrou" toggle (invoice-based payment for enterprise).
- **Funkcie:** tap booking row → P5; "Financovať" → S5 (card charge); "Vrátiť" →
  cancellation/refund flow (tiered: >24h full / 12–24h 80% / <12h 50% of escrow per B2C
  rules; B2B: 20% contractual penalty applies); manage cards → Stripe hosted UI.
- **Dáta:** `escrow_transactions`, `bookings`, `payments`.
- **Stavy:** no-escrow-yet (empty, CTA to P2); payment-failed (retry banner + reason);
  dispute-active row highlighted in red; refund-in-progress chip.
- **Ref:** v2.7 §5 (escrow state machine, payout timing); C-2 (Brigzy never holds funds —
  all through Stripe Connect); C-6 (B2C refund tiers — 20% flat penalty void for consumer,
  replaced by tiered refund + reputation).

---

### P8 — Invoices — B2B only

- **Účel:** Service-fee invoices issued by Brigzy to the B2B poster for accounting/DPH
  reconciliation. **Hidden from C2C posters.**
- **Obsah/layout:** Invoice list (date, invoice number, amount excl./incl. VAT, status
  Zaplatená/Čakajúca, PDF icon); filter by period; **"Exportovať všetky"** (ZIP of PDFs);
  at top: current VAT status note ("Brigzy nie je platcom DPH — faktúry bez DPH" or
  "Brigzy je platcom DPH 23 %" after threshold).
- **Funkcie:** tap row → open PDF (in-app viewer or share sheet); export ZIP; filter.
- **Dáta:** `invoices` (service-fee invoices, Brigzy → poster).
- **Stavy:** no-invoices-yet; export-loading (progress indicator); missing-ICO warning
  (nudge to complete company profile P10 for proper invoice data).
- **Ref:** v2.7 §6.3; C-8 (VAT 23% once Renewo crosses €50k/yr threshold; currently not a
  VAT payer — invoices issued without DPH for now); C-14.

---

### P9 — Mzdové podklady export — B2B only

- **Účel:** One-click generation of payroll documentation for the employer's accounting
  software (Pohoda / Kros), plus RLFO/SP/ZP XML under the poster's power of attorney.
  **Hidden from C2C posters.**
- **Obsah/layout:** Period picker (month/quarter); worker list for the period with
  completeness indicator (green = KYC payroll data collected, amber = pending); per-worker
  detail: gross pay, contract type, hours, SP/ZP base; export format selector **CSV
  (Pohoda)** / **XML (Kros)** / **SP/ZP RLFO XML**; "Generovať" CTA.
- **Funkcie:** generate → Edge Function pulls encrypted KYC payroll data from
  `contracts.payload_json`, builds the export, returns download link; "Vyžiadať údaje"
  (for workers with missing KYC data) → sends in-app notification to worker to complete W17;
  download/share exported file.
- **Dáta:** `contracts` (payload_json: rodné číslo, ZP, IBAN — encrypted),
  `bookings`, `users`, `work_hours_counters`.
- **Stavy:** missing-kyc-for-worker (amber row, "Vyžiadať" CTA, export blocked for that
  worker); export-generating (spinner); empty period (no completed bookings in range);
  PoA-not-signed edge (block export, nudge to sign intermediary agreement — future lawyer
  item C-1).
- **Ref:** v2.7 §4 (KYC layer 3 — own Brigzy payroll form), §13 B7 (accountant confirmed
  field list); C-1 (SP/ZP XML under PoA); C-14 (accountant confirmed worker PDF + firm
  CSV/XML); C-9 (GDPR — payroll data 10y retention, encrypt at rest).

---

### P10 — Company profile — B2B only

- **Účel:** Company identity and billing info. Completing this unlocks B2B features:
  DoVP/DoPČ contracts, invoicing, mzdové podklady export. **C2C posters see P11 instead.**
- **Obsah/layout:** Fields: company name, **IČO** (with auto-lookup via
  orsr.sk/finstat API — prefills name + address), DIČ, **IČ DPH** (if VAT payer),
  billing address, contact person (name + phone), company logo upload; save button.
  Below: "Splnomocnenie & intermediárska zmluva" section (download/sign — future C-1 item,
  shown as locked placeholder for now).
- **Funkcie:** IČO lookup → auto-fill; save → updates `users` company fields;
  upload logo → `avatars` bucket; link to intermediary agreement (future).
- **Dáta:** `users` (ico, dic, ic_dph, company_name, billing_address fields).
- **Stavy:** incomplete nudge (amber strip "Doplňte IČO pre správne faktúry") on P1
  dashboard until saved; IČO-not-found (manual entry fallback); IČ DPH validation (SK
  format check).
- **Ref:** v2.7 §2.3 (B2B poster); C-8 (IČ DPH on invoices required once VAT payer);
  C-1 (intermediary agreement placeholder — lawyer item).

---

### P11 — Individual profile — C2C

- **Účel:** Individual poster's identity card — simpler than B2B, no company fields.
  Only Zmluva o dielo (§631–643 OZ) available as contract type.
- **Obsah/layout:** Avatar, display name, **★ rating as poster** (average from worker
  reviews), short bio, history of jobs posted (count + categories), member since date;
  "Upraviť profil" CTA. Note strip: `"Ako jednotlivec môžeš zadávať len Zmluvu o dielo
  (§631 OZ). Pre DoVP/DoPČ potrebuješ firemný účet."` — with "Pridať firmu" link → P10.
- **Funkcie:** edit name/bio/avatar; view public profile (as seen by workers);
  "Pridať firmu" → opens P10 and adds B2B hat to account.
- **Dáta:** `users`, `reviews` (poster_id = me), `jobs` (poster_id = me).
- **Stavy:** no-history; no-rating-yet ("Zatiaľ žiadne hodnotenia"); avatar-placeholder.
- **Ref:** v2.7 §2.3 (C2C poster); §3 (ZoD only for C2C — pure činnosť with dependent-work
  signs = švarcsystém risk, shown as info note); C-1.

---

## B4. Shared sheets (cross-role flows)

> Sheets sú modálne obrazovky (bottom sheet alebo full-screen modal) zdieľané medzi Worker
> a Poster shellom. Väčšina z nich sa otvára z W6 alebo P5 (booking hub).

### S1 — Chat (1:1 + group)

- **Účel:** Realtime komunikácia medzi Workers a Postermi — pred bookingom (po aplikácii),
  počas booking procesu, aj po ňom. Skupinový chat pre multi-slot jobs koordinuje všetkých
  Workers naraz.

- **Obsah/layout — dve úrovne:**

  **Inbox (Chat tab v oboch shelloch):**
  Zoznam konverzácií zoradený od najnovšej správy. Každý riadok: avatar + meno protistrany,
  názov brigády (kontext), preview poslednej správy (max 1 riadok), timestamp, unread badge.
  Skupinové chaty označené ikonou skupiny + počet účastníkov.

  **Thread (otvorená konverzácia):**
  Bubliny (vlastné = vpravo, cudzie = vľavo), clay-štýl. Header: `[Meno] · [Názov brigády]`
  + status pill + shortcut na booking detail (W6/P5). Vstupný bar: textové pole + send button
  (budúcnosť: príloha/foto). **Systémové správy** (vizuálne odlíšené, sender = null):
  `"[Meno] sa prihlásil/a"` · `"Zmluva podpísaná"` · `"Escrow financovaný — X €"` ·
  `"Dodatok schválený — +X €"` · `"Brigáda dokončená — hodnotenie čaká"`.

  **Skupinový chat (multi-slot):**
  Rovnaká štruktúra ako 1:1. Poster vidí všetkých Workers; každý Worker vidí Postera +
  ostatných Workers. Aktivuje sa na P3 po obsadení ≥2 miest. Poster môže pridať nového
  participanta pri každom ďalšom obsadenom slote.

- **Funkcie:** odosielanie správy (optimistic UI); Supabase Realtime subscribe na
  `messages` kde `conversation_id = X`; unread badge na Chat tab + Notifications bell;
  dlhý stlak → copy text (MVP); swipe-to-archive v inboxe.
  **✅ DECISION-S1a:** chat sa **automaticky otvorí** po Apply (Worker → ihneď S1 thread
  s Posterom); **✅ DECISION-S1b:** chat je aktívny **pred výberom** — Worker a Poster si
  môžu písať od momentu aplikácie.

- **Dáta:**
  - `conversations` — `id`, `job_id`, `booking_id` (null pre pre-booking), `type`
    (`direct`/`group`), `created_at`
  - `conversation_participants` — `conversation_id`, `user_id`, `unread_count`
  - `messages` — `id`, `conversation_id`, `sender_id` (null = system), `content`,
    `message_type` (`text`/`system`), `created_at`

- **Stavy:** loading skeleton; prázdna konverzácia (`"Napíš [Meno]…"`); offline —
  cached správy viditeľné, send queued + banner `"Bez pripojenia — správy sa odošlú
  po obnovení"`; konverzácia uzavretej/expirovanej brigády → read-only banner.

- **Ref:** v2.7 §9.3 (group chat, multi-slot); A6 (chat shortcut z W3/W6/P4/P5);
  S2 (cenová negociácia prebieha cez dedikovaný sheet, nie cez chat).

---

### S2 — Price negotiation sheet

- **Účel:** Worker navrhne inú sadzbu ako je uvedená v inzeráte; Poster akceptuje,
  zamietne, alebo kontranávrh. Odsúhlasená sadzba vstupuje priamo do výpočtu escrow.
  Transparentná história ponúk, max 3 kolá.

- **Obsah/layout:** Bottom sheet, dve varianty podľa strany:

  **Worker strana** (iniciatíva):
  Header `"Navrhnúť inú cenu"`; zobrazí aktuálnu inzerovanú sadzbu (`"Inzerát: X €/h"`
  alebo `"Fixne: X €"`); input pole pre návrh (rovnaká jednotka — hodinová / fixná podľa
  typu brigády); voliteľná krátka poznámka (max 160 znakov, napr. vysvetlenie);
  fee preview (real-time: navrhnutá sadzba → výsledná výplata Worker-a po poplatku);
  CTA `"Navrhnúť"` + `"Zrušiť"`.

  **Poster strana** (odpoveď):
  Header `"[Meno] navrhuje X €/h"` (vs `"Inzerát: Y €/h"`); história kôl (timeline —
  max 3 riadky: pôvodná → návrh W → prípadný kontra P); tri CTAs:
  `"Prijať"` · `"Kontranávrh"` · `"Zamietnuť"`.
  Pri výbere Kontranávrh: rozbalí sa input pole pre Posterovu hodnotu + voliteľná poznámka.

  **Po prijatí:** sheet sa zatvára, do chat threadu vstúpi systémová správa
  `"Cena dohodnutá: X €/h — escrow bude prepočítaný."` Escrow suma v S5 sa aktualizuje
  na dohodnutú sadzbu × odhadovaný počet hodín.

- **Funkcie:**
  - **✅ DECISION-S2a:** Worker otvorí sheet len z **W6** (po apply, pred podpisom zmluvy) — nie z W3
  - Poster odpovie notifikáciou → otvorí sheet z P4/P5
  - Kolo 1: Worker navrhuje; Kolo 2: Poster akceptuje / kontranávrh; Kolo 3: Worker
    akceptuje / kontranávrh; po 3. kole — ďalší návrh nie je možný, len Accept/Reject
  - Accept → `price_negotiations.status = accepted`; escrow_amount recomputed;
    systémová správa do S1
  - Reject → status `rejected`; aplikácia stále aktívna na pôvodnej sadzbe (Worker
    môže prijať pôvodnú alebo stiahnuť aplikáciu)
  - Expiry: ak Poster neodpovie do 24h → návrh expiruje, Worker dostane notifikáciu

- **Dáta:**
  - `price_negotiations` — `id`, `application_id`, `round` (1–3), `proposed_by`
    (`worker`/`poster`), `rate`, `rate_type` (`hourly`/`fixed`), `note`, `status`
    (`pending`/`accepted`/`rejected`/`expired`), `created_at`
  - `applications.negotiated_rate` (denormalizovaná finálna dohodnutá sadzba)

- **Stavy:** pending-response (čaká strana X); accepted (sheet read-only, zelený banner);
  rejected (sheet read-only, červený banner + `"Pracovník stále môže prijať pôvodnú
  sadzbu"`); expired (amber banner + resend option); max-rounds-reached (Kolo 3 bez
  zhody → len Accept/Reject, no input); booking-already-signed (sheet zablokovaný —
  negociácia možná len pred podpisom zmluvy).

- **Ref:** v2.7 §9.1 (cenová negociácia); S5 (escrow suma sa aktualizuje po accept);
  S3 (negociácia musí byť uzavretá pred podpisom zmluvy).

---

### S3 — Contract preview + sign (OTP / BOK AdES)

- **Účel:** Obidve strany prečítajú plný text zmluvy a podpíšu digitálne (SMS OTP = AdES)
  alebo naskenovaným fyzickým podpisom (BOK). Booking je zablokovaný, kým nepodpíšu obaja.
  Pre prvý DoVP/DoPČ v danom Worker–Poster páre sa tu zbierajú KYC mzdové údaje (W17).

- **Obsah/layout:** Full-screen modal (nie bottom sheet — zmluva je dlhá).
  Header: badge s typom zmluvy (`DoVP §226` / `DoPČ §228a` / `ZoD §631`) + číslo zmluvy
  (auto-generované) + mená oboch strán. Telo: scrollovateľný generovaný text zmluvy
  (z templates + booking dát: mená, IČO, sadzba, odhadovaný počet hodín, dátumy, miesto,
  kontaktné údaje). **350h poznámka (B2B DoVP):** ak tento kontrakt prinesie pár nad 315h →
  amber informačný banner v texte (nie blokujúci). Sticky bottom panel:
  - progress indikátor `"Podpisuje: [Poster] ✓ · [Worker] ○"` (alebo obráteným poradím podľa toho, kto je prvý)
  - primárny CTA `"Podpísať"` (aktívny len ak user scrollol na koniec alebo uplynulo 5 s)
  - sekundárny link `"Stiahnuť PDF náhľad"` (pred podpisom = watermark DRAFT)

- **Funkcie:**

  **Generovanie zmluvy:**
  Edge Function zostaví zmluvu z template (podľa typu DoVP/DoPČ/ZoD) + payload (mená,
  IČO, sadzba, hodiny, dátumy). Payload uložený šifrovaný v `contracts.payload_json`.
  Generuje sa pri vytvorení bookingu (stav `draft`), nie až pri otvorení sheetu.

  **KYC gate (prvý DoVP/DoPČ tohto páru):**
  Ak `kyc_payroll_status` Worker-a pre tohto Postera = `missing` → pred zobrazením zmluvy
  sa zobrazí W17 forma (rodné číslo, ZP, adresa, IBAN + GDPR súhlas). Po vyplnení → zmluva
  sa dopĺňa o tieto údaje + generuje finálne.

  **Podpisový flow — OTP (default, AdES):**
  1. User ťukne `"Podpísať"` → server odošle SMS OTP na overené tel. číslo
  2. In-app: 6-ciferný input + resend timer (60 s)
  3. Verify → server zaznamená do `contract_otp_events`: timestamp, `user_id`, telefón, IP
  4. `contracts.worker_signed_at` / `contracts.poster_signed_at` nastavené → obe strany
     dostanú notifikáciu + systémová správa do S1
  5. Po podpise oboch: PDF finalizovaný (bez watermarku) + uložený do Supabase Storage;
     odkaz odoslaný emailom aj in-app obomu

  **Podpisový flow — BOK (fyzický podpis, alternatíva):**
  User zvolí `"Podpísať fyzicky"` → inštrukcia na tlač + podpis; naskenuje podpisovú
  stránku cez kameru → upload → uložené ako `contracts.bok_scan_url`; menej robustné
  (nie AdES), označené v PDF ako `"Fyzický podpis — scan"`; povolené len ak OTP zlyhá
  (nedostupnosť telefónu).

  **Po podpise oboch strán:** booking postúpi do stavu `in_progress` — escrow je už
  fundovaný (poradie je **fund → sign**: S5 prebehlo pri výbere Worker-a, S3 je
  posledná brána pred prácou; oprava 2026-06-11, [[Spec-Audit-2026-06-11]]).
  Ďalší krok = deň práce a QR check-in (W7/S6).

- **Dáta:**
  - `contracts` — `id`, `booking_id`, `type`, `template_version`, `payload_json`
    (šifrované), `generated_at`, `worker_signed_at`, `worker_sign_method`
    (`otp`/`bok`/`pending`), `poster_signed_at`, `poster_sign_method`, `pdf_url`,
    `bok_scan_url`, `status` (`draft`/`pending_signatures`/`signed`)
  - `contract_otp_events` — `id`, `contract_id`, `user_id`, `phone_last4`, `sent_at`,
    `verified_at`, `ip_hash`

- **Stavy:**
  - **KYC-gate** (pre Worker, prvý DoVP/DoPČ) — W17 forma blokuje zobrazenie zmluvy; po
    vyplnení sa plynule pokračuje
  - **Awaiting-my-signature** — CTA aktívne, second party stav `"čaká na podpis"`
  - **OTP-sent** — input viditeľný, resend timer; chyby: wrong-code (2× retry, potom BOK
    fallback ponúknutý), expired (resend)
  - **Awaiting-other-party** — zmluva read-only, banner `"Čakáme na podpis [Meno]"`,
    reminder CTA `"Pripomenúť [Meno]"` (odošle notifikáciu, 1× / 24h)
  - **Both-signed** — zelený banner, PDF download aktívny, `"Pokračovať"` → Worker → W6,
    Poster → P5 (booking = `in_progress`, čaká sa na deň práce + QR check-in)
  - **Expired-contract** (booking zrušený) — read-only, šedý banner

- **Ref:** v2.7 §3.3 (AdES OTP + BOK fyzický podpis, PDF obom stranám, blokovanie
  postupu); §4 (KYC payroll just-in-time pri prvom DoVP/DoPČ → W17); §3 (template
  podľa contract matrix); C-1 (šablóny od Davida — právnik ešte neoveroval); C-3/C-12
  (AdES audit trail requirements); C-9 (GDPR — payload šifrovaný at-rest, 10y retencia).
  **✅ DECISION-S3a:** Poster podpisuje **prvý** — je to jeho iniciatíva, Worker vidí
  vážny zámer pred vlastným podpisom.

---

### S4 — Dodatok (addendum) sheet

- **Účel:** Počas prebiehajúcej brigády (`in_progress`) jedna strana navrhne prácu navyše
  (rozsah + cena). Po vzájomnom odsúhlasení sa doblokuje extra escrow a automaticky
  vygeneruje Dodatok k pôvodnej zmluve — obaja podpíšu. Hodiny z Dodatku vstupujú
  do 350h počítadla (B2B).

- **Obsah/layout:** Bottom sheet (nie full-screen — kratší ako S3).

  **Krok 1 — Návrh (initiator strana):**
  Header `"+ Práca navyše"`; popis extra práce (textové pole, max 300 znakov);
  suma — výber: fixná čiastka **alebo** hodinová sadzba × odhadovaný počet hodín
  (s real-time prepočtom na hrubú/čistú sumu vrátane poplatku);
  poznámka že typ zmluvy sa nemení (`"Dodatok k DoVP č. [X] — typ zmluvy sa nemení"`);
  CTA `"Odoslať návrh"`.

  **Krok 2 — Odpoveď (druhá strana):**
  Zobrazí sa popis + suma + fee preview; CTAs `"Prijať"` · `"Odmietnuť"`.
  Zamietnutie je bezpečné (žiadna penalizácia), booking pokračuje bez Dodatku.

  **Krok 3 — Extra escrow (Poster):**
  Po prijatí Poster vidí escrow sheet (embedded v S4, nie separátny S5) pre doplatok;
  suma = schválená extra čiastka; card charge → `escrow_transactions.addendum_id`.

  **Krok 4 — Podpis Dodatku (obaja, OTP):**
  Auto-vygenerovaný Dodatok (1 strana A4: referencuje pôvodnú zmluvu, pridáva popis +
  sumu + dátum + podpisy); rovnaký OTP flow ako S3; po podpise oboch → PDF priložený
  k pôvodnej zmluve; systémová správa do S1 `"Dodatok podpísaný — +X €"`.

- **Funkcie:**
  - Iniciuje **Poster** (button `"+ Práca navyše"` v P5 počas `in_progress`) **alebo
    Worker** (button v W6 počas `in_progress`) — symetricky
  - Paralelné Dodatky nie sú povolené: ak jeden Dodatok čaká na schválenie/podpis,
    button `"+ Práca navyše"` je disabled u oboch strán (banner `"Prebieha Dodatok"`)
  - Hodiny z Dodatku (ak hodinový typ) → `work_hours_counters.total_hours` += odhadované
    hodiny (B2B: 350h sledovanie)
  - Zamietnutý Dodatok: žiadny záznam v `contracts`, len `status = rejected` v
    `contract_addendums`; booking pokračuje

- **Dáta:**
  - `contract_addendums` — `id`, `contract_id`, `booking_id`, `initiated_by` (`worker`/
    `poster`), `description`, `amount_type` (`fixed`/`hourly`), `amount`, `hours_estimate`,
    `status` (`pending_acceptance`/`accepted`/`rejected`/`pending_escrow`/
    `pending_signatures`/`signed`), `worker_signed_at`, `poster_signed_at`,
    `pdf_url`, `escrow_transaction_id`

- **Stavy:**
  - **pending-acceptance** — druhá strana dostala notifikáciu, čaká; initiator vidí
    `"Čakáme na odpoveď [Meno]"` (read-only)
  - **rejected** — krátke toast `"[Meno] odmietol Dodatok"`, sheet sa zatvára,
    booking pokračuje
  - **pending-escrow** — Poster musí doplatiť escrow (blokujúce pre ďalší postup
    Dodatku, nie pre hlavný booking)
  - **pending-signatures** — OTP flow pre oboch, rovnaké stavy ako S3
  - **signed** — zelený banner `"Dodatok platný"`, PDF dostupný v W6/P5 v sekcii
    zmluvných dokumentov
  - **in-progress-blocked** — ak druhý Dodatok prichádza kým prvý nie je uzavretý →
    button disabled u oboch

- **Ref:** v2.7 §9.6 (Dodatok — extra práca navyše, nemení typ zmluvy, hodiny do 350h
  počítadla); §5 (extra escrow pre Dodatok); §3.3 (OTP podpis rovnaký ako hlavná zmluva);
  C-1 (Dodatok šablóna súčasť balíka od Davida — právnik ešte neoveroval).

---

### S5 — Escrow confirm sheet

- **Účel:** Poster zablokuje dohodnutú sumu v Stripe escrow — bez toho booking nepostúpi
  na podpis zmluvy. Brigzy nikdy finančné prostriedky nedistribuuje priamo (C-2 —
  Stripe Connect drží; Brigzy = intermediár).

- **Obsah/layout:** Bottom sheet, jedna strana.
  Header `"Zablokovať platbu"` + názov brigády + meno Worker-a.

  **Rozúčtovanie (vždy viditeľné pred platbou):**
  ```
  Dohodnutá odmena        X,XX €
  Servisný poplatok       + Y,XX €   (Pásmo 1 paušál / Pásmo 2 %)
  ─────────────────────────────────
  Celkom k úhrade         Z,XX €
  Worker dostane:         X,XX €
  ```
  Malý info-link `"Ako sa počíta poplatok?"` → inline tooltip (v2.7 §6).

  **Platobná metóda:**
  Zoznam uložených kariet (Stripe Payment Methods); `"+ Pridať kartu"` (Stripe hosted
  UI, inline webview); **B2B only:** toggle `"Platiť faktúrou"` — vygeneruje faktúru
  namiesto okamžitého charge (pre firmy s interným schvaľovaním).

  Sticky CTA `"Zablokovať Z,XX €"` (šedá kým nie je vybraná karta; aktívna po výbere).
  Pod CTA malý text: `"Suma je zablokovaná — uvoľní sa až po potvrdení dokončenia práce."`.

- **Funkcie:**
  - Otvorí sa **automaticky** z P4 po výbere Worker-a (alebo bulk-výbere N Workers —
    N×sheet, alebo jeden súhrnný sheet pre batch)
  - Stripe `PaymentIntent` s **okamžitým capture** — suma sa reálne strhne a drží
    na platformovom balance až do release. **⚠️ NIE manual capture** (oprava
    2026-06-11, [[Spec-Audit-2026-06-11]]): neodchytená autorizácia expiruje po
    ~7 dňoch — brigáda zadaná ďalej v budúcnosti / viacdňová by sa rozbila.
    Zrušenie = skutočný **Refund** (plný pred podpisom, tiered po podpise).
  - Po úspešnej platbe: `escrow_transactions.state = pending` (zablokované); obe
    strany dostanú notifikáciu `"Escrow zablokovaný — podpíšte zmluvu"`; flow
    postúpi na S3
  - **B2B faktúra:** `escrow_transactions.state = pending_invoice`; Poster dostane
    faktúru emailom; booking čaká (S3 nie je odblokovaný) kým platba faktúry
    neprejde cez Stripe (webhook → `state = pending`)
  - **Uvoľnenie escrow** (nie tu, ale pre kontext): Poster z P5 ťukne
    `"Potvrdiť dokončenie"` → Stripe **Transfer** na connected account Worker-a →
    Wallet kreditovaný (mínus poplatok); `state = cleared`
  - **Refund (zrušenie pred prácou):** plný refund ak nie je podpísaná zmluva;
    po podpise — tiered (>24h: 100 % / 12–24h: 80 % / <12h: 50 %) pre B2C;
    B2B: zmluvné podmienky (bez 20% penalty — C-6 void pre consumer)

- **Dáta:**
  - `escrow_transactions` — `id`, `booking_id`, `addendum_id` (null pre hlavný booking),
    `amount_gross`, `service_fee`, `total_charged`, `stripe_payment_intent_id`,
    `stripe_charge_id`, `state` (`created`/`pending`/`pending_invoice`/`cleared`/
    `refunded`/`disputed` — terminológia per [[Data-Model]]: `pending` = zablokované,
    `cleared` = uvoľnené), `funded_at`, `released_at`, `refund_amount`, `refund_reason`
  - `payments` — `id`, `escrow_transaction_id`, `stripe_invoice_id` (B2B),
    `payment_method_id`, `amount`, `currency` (`eur`), `created_at`

- **Stavy:**
  - **loading** — načítavanie uložených kariet (Stripe API)
  - **no-card** — prázdny zoznam, `"+ Pridať kartu"` ako primárny CTA
  - **processing** — spinner, CTA disabled, `"Spracúvame platbu…"`
  - **success** — brief green flash → sheet sa zatvára, booking postúpi na S3;
    systémová správa do S1 `"Escrow financovaný — X €"`
  - **failed** — červený banner s dôvodom (`"Karta zamietnutá"` / `"Nedostatok
    prostriedkov"` / `"Vypršala platnosť"`); retry CTA + možnosť zmeniť kartu
  - **pending-invoice** (B2B) — info banner `"Faktúra odoslaná na [email]. Booking
    čaká na úhradu."` + možnosť prepnúť na okamžitú platbu kartou
  - **already-funded** — read-only, zobrazí zaplatenú sumu + dátum (napr. pri znovu
    otvorení P5)

- **Ref:** v2.7 §5 (escrow state machine Pending→Funded→Released/Disputed; Stripe
  Connect delayed capture); §6 (two-tier service fee — paušál/percent); C-2 (Brigzy
  nedistribuuje peniaze priamo — Stripe Connect drží); C-6 (B2C refund tiers, 20%
  penalty void); ADR-0004 (Stripe Connect architecture).
  **✅ DECISION-S5a:** Batch escrow (multi-slot) = **jeden súhrnný sheet** (N Workers,
  jedna platba, N `escrow_transactions` na pozadí).

---

### S6 — QR scan (Poster) / QR show (Worker)

- **Účel:** Preukázanie fyzickej prítomnosti pri check-in a check-out — Worker zobrazí
  dynamický QR kód, Poster ho naskenuje. Každý sken zaznamená GPS + timestamp a buduje
  audit trail dochádzky pre mzdové podklady a prípadný spor.

- **Obsah/layout — dve strany toho istého flow:**

  **Worker strana — „Ukáž QR" (z W7):**
  Celá obrazovka vyplnená QR kódom (max kontrast, clay rámček, veľkosť min. 250 × 250 pt).
  Pod kódom: stav (`"Čakáme na check-in"` / `"Pracuješ od HH:MM"` / `"Odchod potvrdený"`),
  live timer odpracovaného času (po check-in), Brigy ticker (`"+10 / hodinu"`).
  Pravý horný roh: tlačidlo `"SOS / Kontakt"` → telefón Postera.
  QR sa **automaticky rotuje každých 60 s** (nový nonce); countdown indikátor pod kódom
  (`"Obnoví sa za 42 s"`). Worker nemusí nič robiť — rotácia je silent na pozadí.

  **Poster strana — „Skenuj QR" (z P5):**
  Camera viewfinder s clay overlay a centrovacím rámom. Header: `"Naskenuj QR brigádnika"`;
  pod viewfinderom meno Worker-a a typ skenu (`"Check-in"` alebo `"Check-out"` — server
  určí automaticky podľa posledného eventu). Po úspešnom skene: zelený flash + `"✓ [Meno]
  — Check-in [HH:MM]"` (alebo Check-out) + GPS ikona (ak lokácia zaznamenaná). Sheet sa
  po 2 s automaticky zatvára a vracia do P5.

- **Funkcie:**
  - **QR generovanie (Worker):** pri otvorení W7 server vygeneruje `nonce` (UUID,
    TTL 65 s — 5 s rezerva); QR kóduje `{nonce, booking_id, worker_id}`; po 60 s
    Worker app potichu fetchne nový nonce a překreslí QR (bez interakcie user-a)
  - **QR validácia (Poster scan):** server overí nonce (existuje + nevypršal + patrí
    k tomuto booking_id + scanner je Poster tohto bookingu); pri OK →
    vytvorí `attendance_events` záznam; nonce sa označí ako použitý (replay-proof)
  - **GPS záznam:** GPS Poster-a pri skene (nie Worker-a — Poster je na mieste práce);
    ak Poster odoprie lokáciu → sken prebehne, `gps_lat/lng = null`, amber warning
    v P5 (`"Lokácia nezaznamenaná"`); nie je blokujúce v MVP
  - **Viacero pracovných dní:** jeden booking môže mať N párov check-in/check-out
    (napr. brigáda trvá 3 dni); každý pár = 1 pracovná session; celkový čas =
    súčet všetkých sessions; W7 / P5 zobrazujú kumulatívny odpracovaný čas
  - **Check-out bez check-in:** server odmietne (error: `"Najprv check-in"`);
    opačne tiež (dvojitý check-in bez check-out = server odmietne druhý, varuje Postera)

- **Dáta:**
  - `attendance_events` — `id`, `booking_id`, `type` (`check_in`/`check_out`),
    `worker_id`, `scanned_by` (poster_id), `nonce_used`, `gps_lat`, `gps_lng`,
    `device_timestamp`, `server_timestamp`
  - QR nonces — ephemeral, uložené v Supabase (tabuľka `qr_nonces`: `nonce`, `booking_id`,
    `worker_id`, `expires_at`, `used_at`); TTL 65 s, cron cleanup

- **Stavy:**

  *Worker (W7):*
  - **not-checked-in** — QR veľký, `"Čakáme na check-in od Postera"`, Brigy ticker nebeží
  - **checked-in** — timer beží, Brigy ticker aktívny, QR pre check-out (vizuálne rovnaký)
  - **checked-out** — summary: `"Odpracované: Xh Ym · Earned: X € · +N Brigy"`,
    CTA `"Zatvoriť"` → W6
  - **nonce-refresh** — seamless na pozadí, user nevidí nič; ak fetch zlyhá (offline)
    → amber banner `"Bez pripojenia — QR nemusí byť platný; Poster ho môže odmietnuť"`

  *Poster (P5 → S6):*
  - **scanning** — camera live, čaká na QR
  - **success-checkin / success-checkout** — zelený flash, auto-zatvára sa za 2 s
  - **expired-nonce** — `"QR vypršal — požiadaj brigádnika o obnovenie"`
    (Worker ho obnoví automaticky za max 60 s)
  - **wrong-booking** — `"Tento QR nepatrí k tejto brigáde"` (napr. Worker omylom
    ukáže starý kód)
  - **camera-denied** — inštrukcia na povolenie kamery v nastaveniach OS

- **Ref:** v2.7 §9.4 (QR check-in/out, GPS+timestamp audit trail); W7 (Worker
  strana + Brigy ticker); P5 (Poster strana + scan entry point); mzdové podklady
  (attendance data → P9 export).

---

### S7 — Blind review

- **Účel:** Obojstranné hodnotenie po dokončení brigády. „Blind" = žiadna strana nevidí
  hodnotenie tej druhej, kým obidve neodošlú — eliminuje bias a taktické hodnotenie.
  Výsledky vstupujú do verejných profilov (W13, P10/P11) a XP systému.

- **Obsah/layout:** Full-screen modal (nie bottom sheet — dosť obsahu).
  Header: `"Ohodnoť [Meno]"` + avatar + název brigády.

  **Worker hodnotí Postera:**
  - ★ Celkové hodnotenie (1–5, povinné)
  - 3 kategórie (každá 1–5, voliteľné):
    `Komunikácia` · `Férové podmienky` · `Odporúčam zadávateľa`
  - Písomná recenzia (textarea, max 300 znakov, voliteľná)
  - CTA `"Odoslať hodnotenie"`

  **Poster hodnotí Worker-a:**
  - ★ Celkové hodnotenie (1–5, povinné)
  - 3 kategórie (každá 1–5, voliteľné):
    `Dochvíľnosť` · `Kvalita práce` · `Spoľahlivosť`
  - Písomná recenzia (textarea, max 300 znakov, voliteľná)
  - CTA `"Odoslať hodnotenie"`

  **Po odoslaní — čakací stav:**
  Animovaný clay „zapečatený obálkový" ilustrácia; text `"Tvoje hodnotenie je uložené.
  Ukážeme ho, keď [Meno] tiež ohodnotí."` + progress indikátor `"Ty ✓ · [Meno] ○"`.

  **Reveal (obaja odoslali):**
  Krátka reveal animácia (obálka sa otvára) → zobrazí obe hodnotenia vedľa seba
  (tvoje vľavo, ich vpravo); celkové hviezdy veľké, kategórie menšie, text recenzie pod nimi.

- **Funkcie:**
  - Trigger: automatická notifikácia obom stranám po `escrow released` + po odoslaní
    hodnotenia P6 cross-sell (Poster) alebo priamo z W6/P5
  - Po odoslaní: `reviews.submitted_at` nastavené; druhá strana dostane notifikáciu
    `"[Meno] ťa ohodnotil/a — ohodnoť aj ty"` (ak ešte neohodnotila)
  - Reveal: keď obe `submitted_at` sú vyplnené → obaja dostanú notifikáciu + reveal
    zobrazí sa pri ďalšom otvorení S7 (alebo z deep-link notifikácie)
  - Hodnotenia sa objavia vo verejných profiloch (W13, P10/P11) až po reveal (nie skôr)
  - **Okno 14 dní:** po 14 dňoch od `escrow released` bez odoslania hodnotenia →
    booking sa označí `review_expired`; hodnotenie nie je možné; na profile sa
    zobrazuje iba `"Brigáda bez hodnotenia"` (neutrálne, bez penalizácie rating-u)
  - Reminder notifikácie: deň 1 (ihneď po trigger), deň 4, deň 10 — potom stop

- **Dáta:**
  - `reviews` — `id`, `booking_id`, `reviewer_id`, `reviewee_id`, `role`
    (`worker_reviewing_poster` / `poster_reviewing_worker`), `rating_overall` (1–5),
    `rating_communication` (1–5, null), `rating_conditions` (1–5, null),
    `rating_punctuality` (1–5, null), `rating_quality` (1–5, null),
    `rating_reliability` (1–5, null), `text` (max 300), `submitted_at`,
    `revealed_at` (timestamp keď obe strany odoslali)
  - `users.rating_avg` — denormalizovaný priemer (recount po každom reveal)
  - `xp_events` — `+20 XP` za odoslanie hodnotenia (Worker aj Poster)

- **Stavy:**
  - **pending-my-review** — formulár aktívny, druhá strana ešte neohodnotila
    (alebo ohodnotila, ale ja neviem — blind)
  - **submitted-waiting** — moje hodnotenie odoslané, čakám na druhú stranu;
    `"Pripomenúť [Meno]"` CTA (max 1×, odošle notifikáciu)
  - **revealed** — obe hodnotenia viditeľné; CTA `"Zatvoriť"` → W6/P5 completed view
  - **review-expired** — amber banner `"Lehota na hodnotenie vypršala"`, formulár
    read-only prázdny
  - **already-reviewed** — ak user otvorí S7 znova po reveal → zobrazí obe hodnotenia
    (read-only, bez formulára)

- **Ref:** v2.7 §2.1 (Worker rating → XP + verejný profil); §2.2 (Brigzy Verified —
  rating threshold); W13 (Worker verejný profil); P10/P11 (Poster verejný profil);
  S8 (dispute zablokuje S7 — hodnotenie nie je možné kým spor nie je uzavretý).

---

### S8 — Report a problem / dispute

- **Účel:** Ktorákoľvek strana môže nahlásiť problém počas alebo po brigáde. Odoslanie
  reportu **okamžite zmrazí escrow** a otvorí support ticket — booking sa presunie do
  stavu `disputed` a zostane tam, kým support prípad neuzavrie. Blokuje S7 (hodnotenie).

- **Obsah/layout:** Bottom sheet (rozbaliteľný na full-screen po výbere kategórie).

  **Krok 1 — Kategória:**
  Dve sady podľa roly:

  *Worker hlási Postera:*
  `Nebezpečné podmienky` · `Popis nezodpovedal realite` · `Obťažovanie / diskriminácia`
  · `Neuhradený Dodatok` · `Iné`

  *Poster hlási Worker-a:*
  `Neprišiel (no-show)` · `Výrazné meškanie` · `Nekvalitná práca` · `Poškodenie majetku`
  · `Podozrenie z podvodu` · `Iné`

  **Krok 2 — Dôkazy:**
  Textový popis (povinný, min 30 znakov); upload fotiek (max 5, z kamery alebo galérie);
  automaticky priložené: timestamp odoslania, odkaz na booking (zmluva, dochádzka, chat).

  **Krok 3 — Potvrdenie:**
  Súhrnný card s kategóriou + preview textu + počet fotiek; veľký červený warning box:
  `"Odoslaním sa escrow okamžite zmrazí. Suma bude uvoľnená až po rozhodnutí supportu."`
  CTA `"Odoslať report"` · `"Zrušiť"`.

  **Po odoslaní:**
  Inline stav v W6/P5: červený `"Disputed"` banner s popisom stavu a odkazom na
  support chat (S11); všetky akcie (release, QR, Dodatok) sú disabled.

- **Funkcie:**
  - Prístup z W6 (Worker) a P5 (Poster) cez `"Nahlásiť problém"` button; dostupný
    od stavu `signed` (po podpise zmluvy) až po `released` (pred uvoľnením escrow)
  - Po odoslaní: `escrow_transactions.state = disputed`; `bookings.status = disputed`;
    obaja dostanú notifikáciu (`"Spor otvorený — escrow zmrazený"`); vytvorí sa
    `disputes` záznam + otvorí sa support ticket prepojený na S11
  - Druhá strana môže **pridať vyjadrenie** (async, cez S11 support chat) — formulár
    na pridanie dôkazov ostáva dostupný obe strany po dobu sporu
  - **Automatické dôkazy priložené supportu** (neviditeľne pre bežného usera):
    zmluva + Dodatok, `attendance_events` (check-in/out timestamps + GPS),
    posledných 50 správ z S1 chat logu, escrow história
  - **Riešenie (support — manuálne v MVP, cieľ 48h):**
    - `resolved-worker` → escrow uvoľnený Worker-ovi (+ servisný poplatok)
    - `resolved-poster` → plný refund Posterovi
    - `resolved-split` → dohodnuté percento každej strane (support zadá %)
    - `resolved-no-action` → spor zamietnutý, escrow uvoľnený pôvodne (Worker dostane)
  - **Reputačný dopad** pri potvrdenom závažnom porušení (no-show, nebezpečné podmienky):
    `users.dispute_strikes += 1`; po 3 strike-och → account review (manuálny flag, nie
    automatický ban v MVP)
  - Po uzavretí sporu: S7 hodnotenie sa odblokuje (s kontextom `"Táto brigáda mala
    otvorený spor"` — neviditeľné pre verejnosť, len interný tag)

- **Dáta:**
  - `disputes` — `id`, `booking_id`, `raised_by` (user_id), `raised_against` (user_id),
    `category`, `description`, `evidence_urls[]`, `status` (`open`/`info_requested`/
    `resolved_worker`/`resolved_poster`/`resolved_split`/`resolved_no_action`),
    `resolution_split_pct` (0–100, pre resolved-split), `resolution_note`,
    `support_agent_id`, `created_at`, `resolved_at`
  - `dispute_messages` — async komunikácia strán so supportom (prepojené na S11);
    `id`, `dispute_id`, `sender_id`, `content`, `attachments[]`, `created_at`
  - `users.dispute_strikes` — počítadlo potvrdených porušení

- **Stavy:**
  - **open** — spinner / `"Spor sa rieši — odhadovaný čas: 48h"`; všetky booking
    akcie frozen; obaja vidia rovnaký stav v W6/P5
  - **info-requested** — amber banner `"Support potrebuje ďalšie informácie od teba"`
    + CTA `"Odpovedať"` → S11
  - **resolved-[typ]** — zelený/červený/oranžový banner podľa výsledku; suma/refund
    sa spracuje do 3 pracovných dní (Stripe); S7 odblokovaný; booking = `completed`
  - **strike-warning** (interné, viditeľné len postihnutej strane) — in-app notifikácia
    `"Dostali ste upozornenie za porušenie pravidiel. (1/3)"`

- **Ref:** v2.7 §5 (escrow stav `Disputed` → zmrazenie → manuálne riešenie);
  C-2 (Brigzy nie je banka — refund cez Stripe, nie manuálny prevod); C-6 (B2C
  spotrebiteľské práva — refund tiers pre zrušenie; dispute = odlišný prípad od
  zrušenia); S11 (support chat prepojený na dispute ticket); S7 (blokovaný počas
  sporu).

---

### S9 — Insurance opt-out + claim ⚠️ C-5 feature flag

> **⚠️ Celé S9 je za feature flagom `insurance_enabled`.** Kým právnik nepotvrdí
> licenčnú otázku C-5 (sprostredkovanie poistenia cez FinExpert/Universal), všetky
> UI prvky popísané tu zostávajú skryté. Flag = `false` v produkcii pri launchi;
> zapne sa samostatným deployom po právnom clearance.

- **Účel:** (A) Poster sa pri vytváraní brigády môže odhlásiť z predvoleného poistenia
  Worker-a cez FinExpert. (B) Ak k úrazu alebo škode dôjde, postihnutá strana podá
  claim priamo z aplikácie — Brigzy ho preposiela FinExpertu ako intermediár.

---

#### S9-A — Opt-out (súčasť P2, krok 6 — Nastavenia)

- **Obsah:** Checkbox (predvolene **zaškrtnutý**):
  `"☑ Chcem poistenie Worker-a cez FinExpert (+X €)"`.
  Pod checkboxom rozbaľovací tooltip: čo poistenie kryje (úraz pri práci, poistná suma
  Y €), kto ho platí (Poster — zahrnuté v servisnom poplatku alebo ako samostatná položka,
  závisí od finálnych podmienok FinExpert — **doplniť po C-5 clearance**).
  Ak Poster odškrtne → checkbox = `"☐ Bez poistenia"` + amber warning
  `"Brigádnik nebude poistený. V prípade úrazu zodpovedáš za škodu ty."`.

- **Funkcie:** Hodnota sa uloží do `jobs.insurance_opted_in` (boolean). Worker vidí
  v W3 (job detail) badge `"Poistený FinExpert"` alebo `"Bez poistenia"` — relevantné
  pre jeho rozhodnutie prihlásiť sa.

- **Dáta:** `jobs.insurance_opted_in`, `jobs.insurance_premium` (suma v centoch, null
  ak opted-out).

---

#### S9-B — Claim flow (z W6 alebo P5, počas alebo po brigáde)

- **Obsah/layout:** Full-screen modal. Prístupný len ak `jobs.insurance_opted_in = true`
  pre daný booking; ak nie → button skrytý, pri pokuse → info sheet
  `"Toto poistenie nebolo pre túto brigádu aktivované."`.

  **Krok 1 — Typ incidentu** (výber jednej karty):
  `Úraz brigádnika` · `Škoda na majetku zadávateľa` · `Škoda tretej osobe` · `Iné`

  **Krok 2 — Popis incidentu:**
  Dátum a čas (predvyplnené aktuálnym, editovateľné); miesto (predvyplnené z job
  location); textový popis (povinný, min 50 znakov); upload dôkazov — fotky (max 10),
  lekárska správa (PDF, pri úraze — odporúčané, nie povinné v MVP).

  **Krok 3 — Potvrdenie:**
  Súhrn; info box: `"Brigzy váš claim zašle FinExpert. Ďalší kontakt bude priamo od
  FinExpert na váš email [email]. Brigzy nie je poisťovňou a nevybavuje claimy."`;
  CTA `"Odoslať claim"`.

  **Po odoslaní:**
  `insurance_claims.status = submitted`; Brigzy Edge Function pošle claim
  FinExpertu (email/API — podľa dohodnutej integrácie po C-5); user dostane
  confirmation email s referenčným číslom; v W6/P5 sa zobrazí read-only
  claim card so stavom a ref. číslom.

- **Funkcie:**
  - Iniciovať môže **Worker aj Poster** z W6/P5 (rôzne typy incidentov im sedia)
  - Jeden booking môže mať max 1 aktívny claim (ďalší button disabled počas
    otvoreného claimu s linkom na existujúci)
  - Claim **nezmrazuje escrow** automaticky — escrow a insurance sú nezávislé;
    ak je spor o peniaze → S8; ak je to poistná udalosť → S9
  - Stav claimu sa aktualizuje manuálne (support zadá update podľa odpovede
    FinExpert) → notifikácia userovi; v MVP nie je live API webhook od FinExpert
    (integrácia fáza 2)

- **Dáta:**
  - `insurance_claims` — `id`, `booking_id`, `claimant_id`, `incident_type`,
    `incident_datetime`, `description`, `evidence_urls[]`, `status`
    (`submitted`/`under_review`/`approved`/`rejected`/`paid`),
    `external_ref` (FinExpert ref. číslo), `created_at`, `updated_at`,
    `resolution_note`

- **Stavy:**
  - **insurance-off** — booking nemá poistenie; button skrytý alebo disabled
    s vysvetlením
  - **no-active-claim** — CTA `"Nahlásiť poistnú udalosť"` viditeľné v W6/P5
  - **submitted** — read-only claim card, `"Odoslané FinExpert — ref. [X]"`,
    odhadovaný čas odpovede (závisí od FinExpert — placeholder `"5–10 prac. dní"`)
  - **under-review / approved / rejected / paid** — status pill sa aktualizuje
    manuálne cez admin; user dostane notifikáciu pri každej zmene
  - **flag-off (C-5 not cleared)** — celý button/entry point neexistuje v UI;
    žiadna zmienka o poistení kdekoľvek v appke

- **Ref:** v2.7 §10.1 (FinExpert/Universal insurance, opt-out checkbox, claim flow);
  C-5 (⚠️ licenčná otázka — právnik musí potvrdiť že sprostredkovanie poistenia
  cez Brigzy nevyžaduje vlastnú poisťovaciu licenciu); P2 krok 6 (opt-out checkbox
  pri tvorbe brigády); W3 (Worker vidí badge poistenia pred aplikáciou).

> **📌 S9 POZASTAVENÉ** — detaily claimu a opt-out podmienky sa dorobia po dohode
> s FinExpertom. Feature flag `insurance_enabled = false` pri launchi.

---

### S10 — Notifications

- **Účel:** Centrálny feed všetkých udalostí v appke — náhrada za roztrúsené in-app
  notifikácie. Každý záznam je deep-linkovaný priamo na relevantnú obrazovku.
  Push notifikácie (Expo Notifications) zrkadlia rovnaký obsah.

- **Obsah/layout:** Full-screen list (tab alebo cez bell ikonu v headeri).
  Header: `"Notifikácie"` + filter chip row: `Všetky · Brigády · Platby · Správy · Systém`.
  Každý riadok: ikona typu (farebná, clay-štýl) · text udalosti · relatívny čas ·
  neprečítaná bodka (modrá). Ťuknutie = označí ako prečítané + deep-link.
  Skupinový header `"Dnes"` / `"Tento týždeň"` / `"Staršie"`.
  `"Označiť všetky ako prečítané"` — swipe-to-action alebo button v headeri.

  **Typy notifikácií (ikona · text · deep-link):**

  | Typ | Text (príklad) | Deep-link |
  |-----|---------------|-----------|
  | Nová brigáda | `"Nová brigáda blízko teba: Skladník, 8 €/h"` | W3 |
  | Aplikácia prijatá | `"[Firma] ťa vybrala na brigádu [Názov]"` | W6 |
  | Aplikácia zamietnutá | `"[Firma] obsadila brigádu [Názov]"` | W5 |
  | Nová aplikácia | `"[Meno] sa prihlásil/a na [Názov]"` | P4 |
  | Správa | `"[Meno]: [preview správy…]"` | S1 thread |
  | Podpis zmluvy | `"Podpíš zmluvu pre [Názov] — čaká na teba"` | S3 |
  | Escrow financovaný | `"Escrow zablokovaný: X € pre [Názov]"` | W6 / P5 |
  | Escrow uvoľnený | `"X € prevedených do tvojej peňaženky"` | W8 |
  | Výplata odoslaná | `"Výber X € bol odoslaný na tvoj účet"` | W9 |
  | Hodnotenie čaká | `"Ohodnoť [Meno] za brigádu [Názov]"` | S7 |
  | Hodnotenie odhalené | `"[Meno] ťa ohodnotil/a — pozri si hodnotenie"` | S7 |
  | Spor otvorený | `"Spor na brigáde [Názov] — escrow zmrazený"` | S8 |
  | Spor vyriešený | `"Spor uzavretý: [výsledok]"` | W6 / P5 |
  | Dodatok navrhnutý | `"[Meno] navrhuje prácu navyše: +X €"` | S4 |
  | Claim update | `"FinExpert: váš claim [ref] je [stav]"` | S9 |
  | 350h varovanie | `"S [Meno] máte 318/350 h — zvážte DoPČ"` | P4 |
  | Brigy earned | `"+50 Brigy za dokončenú brigádu!"` | W14 |
  | Systém | `"Brigzy: aktualizácia podmienok služby"` | S12 |

- **Funkcie:**
  - Bell ikona v headeri všetkých hlavných obrazoviek zobrazuje badge s počtom
    neprečítaných; ťuknutie → S10
  - **Push notifikácie** (Expo Notifications + Supabase Edge Function trigger):
    rovnaký obsah ako in-app; deep-link cez Expo Router; vypnuteľné per-typ v S12
  - Filter chips skrývajú/zobrazujú typy; výber sa pamätá v session (nie persistovaný)
  - Infinite scroll (staršie notifikácie sa loadujú on demand); max retencia 90 dní,
    potom auto-delete
  - **Tichý push** (data-only, bez banneru) pre: nové správy ak je chat otvorený,
    Brigy earned — aby neotravoval pri aktívnom používaní

- **Dáta:**
  - `notifications` — `id`, `user_id`, `type` (enum), `title`, `body`, `deep_link`,
    `read_at` (null = neprečítané), `created_at`, `entity_id` (booking_id / job_id /
    dispute_id / …), `entity_type`
  - Push tokeny: `push_tokens` — `user_id`, `token`, `platform` (`ios`/`android`),
    `created_at`; invalidované automaticky ak Expo vráti `DeviceNotRegistered`

- **Stavy:**
  - **empty** — `"Zatiaľ žiadne notifikácie"` s ilustráciou (prázdny zvonček)
  - **all-read** — žiadne modré bodky, badge = 0
  - **filtered-empty** — `"Žiadne [typ] notifikácie"` + `"Zobraziť všetky"` link
  - **push-denied** — amber banner v S10: `"Povol notifikácie v nastaveniach, aby
    ti nič neuniklo"` + CTA `"Povolenia"` → iOS/Android settings deep-link

- **Ref:** v2.7 §9 (notifikačné triggery pre escrow udalosti); A1 (bell ikona
  global pattern); S12 (per-typ push nastavenia); Expo Notifications docs.

---

### S11 — Support chat

- **Účel:** Priamy kontakt s Brigzy tímom — pre otázky, problémy, nahlásenie bugu,
  eskaláciu sporu. MVP = ľudský support odpovedajúci cez admin panel. AI bot asistent
  v druhej fáze.

- **Obsah/layout:** Full-screen chat interface (rovnaký clay štýl ako S1, ale s avatarmi
  Brigzy tímu namiesto userov). Header: `"Brigzy Support"` + zelená bodka ak online
  (pracovné hodiny), sivá ak offline. Vstupný bar: textové pole + send + attach (fotka/
  screenshot). Automatická úvodná správa pri prvom otvorení:
  `"Ahoj [Meno]! Ako ti môžeme pomôcť? Odpovieme čo najskôr (zvyčajne do 2 hodín
  počas prac. dní)."` (systémová správa).

  Ak je ticket prepojený na dispute (S8) → sticky banner v headeri:
  `"Spor #[ID] — [Názov brigády]"` s linkom na S8 detail.

- **Funkcie:**
  - Prístup: z S12 (Settings → `"Kontaktovať support"`) + z S8 (dispute ticket →
    automaticky prepojený kontext) + z W6/P5 (`"Potrebujem pomoc"` secondary link)
  - Každý user má jednu support konverzáciu (nie per-booking); ak prišli z S8,
    dispute kontext je priložený automaticky ako systémová správa na začiatku vlákna
  - Správy uložené v `support_messages`; support tím odpovedá cez **admin panel**
    (pozri Part C)
  - Push notifikácia pri novej odpovedi supportu
  - **Predpripravené rýchle otázky** (chips pod úvodnou správou, len pri prvom otvorení):
    `"Kde sú moje peniaze?"` · `"Problém s prihlásením"` · `"Chcem zmazať účet"` ·
    `"Iný problém"` — ťuknutie predvyplní správu
  - Upload prílohy: screenshot/fotka (max 3, pre bug reporty)
  - Read receipts: `"Prečítané [čas]"` keď support označí správu za prečítanú

- **Dáta:**
  - `support_conversations` — `id`, `user_id`, `dispute_id` (null ak nie je z S8),
    `status` (`open`/`resolved`/`closed`), `created_at`, `resolved_at`
  - `support_messages` — `id`, `conversation_id`, `sender_id` (user alebo support
    agent), `sender_type` (`user`/`agent`/`system`), `content`, `attachment_urls[]`,
    `read_at`, `created_at`

- **Stavy:**
  - **no-conversation** — úvodná správa + rýchle chips
  - **open** — normálny chat; badge na S12 entry ak nová správa od supportu
  - **resolved** — banner `"Tento ticket bol uzavretý. Ak problém pretrváva, napíš nám."`
    + CTA `"Otvoriť nový ticket"` (vytvorí nový `support_conversations` záznam)
  - **offline** — sivá bodka + `"Support je momentálne offline. Odpovieme čo najskôr."`
  - **dispute-linked** — sticky banner s dispute kontextom; support vidí celý kontext sporu

- **Ref:** S8 (dispute ticket → auto-link na support); S12 (entry point); admin
  panel Part C (support tím odpovedá odtiaľ).

---

### S12 — Settings

- **Účel:** Všetky nastavenia účtu, preferencií a právnych súhlasov na jednom mieste.
  Prístupný z W12 / P10/P11 (profil) aj z hamburger menu.

- **Obsah/layout:** Jednoduchý grouped list (iOS settings štýl). Sekcie:

  **Účet:**
  - Zmeniť meno / avatar → inline edit
  - Zmeniť email → OTP na starý + potvrdenie na nový
  - Zmeniť heslo → current + new + confirm
  - Zmeniť telefón → OTP verify (nové číslo), keďže telefón je AdES audit trail

  **Notifikácie:**
  Toggles per kategória (zodpovedá typom z S10):
  `Brigády v okolí` · `Správy` · `Platby & escrow` · `Zmluvy` · `Hodnotenia` ·
  `Systémové správy`; master toggle `"Všetky push notifikácie"` (vypnutie = tichý
  režim, in-app feed S10 stále funguje).

  **Zobrazenie:**
  - Jazyk: `Slovenčina` / `English` (radio)
  - Téma: `Svetlá` / `Tmavá` / `Podľa systému` (radio)

  **Právne:**
  - `Všeobecné obchodné podmienky` → in-app webview / PDF
  - `Zásady ochrany súkromia` → in-app webview / PDF
  - `Správa súhlasov (GDPR)` → zobrazí dané súhlasy (marketing, cookies) s možnosťou
    odvolať; **odvolanie marketingového súhlasu nesmie blokovať používanie appky**
  - `Verzia aplikácie` (read-only, napr. `"1.0.0 (42)"`)

  **Kontaktovať support:**
  → S11

  **Nebezpečná zóna** (červená sekcia dole):
  - `Odhlásiť sa` → confirm dialog → `auth-store.signOut` → E5
  - `Zmazať účet` → confirm dialog (2-step: typ `"ZMAZAT"`) → soft-delete
    (`users.deleted_at`, profil anonymizovaný po 30 dňoch, GDPR čl. 17);
    aktívne bookings a nevyriešené escrow **blokujú** mazanie s vysvetlením.
    **Pozn. (C-9):** zmluvy a mzdové dáta v `contracts.payload_json` prežívajú
    zmazanie účtu — zákonná retencia 10 r. (právny základ ≠ súhlas); anonymizuje
    sa profil, nie zmluvné dokumenty. User to vidí v confirm dialógu.

- **Funkcie:**
  - Všetky zmeny uložené okamžite (bez save button) okrem citlivých (email/telefón/heslo
    — tie majú vlastný OTP flow)
  - Zmena jazyka → okamžite prerenduje celú appku (i18n reload, bez reštartu)
  - Zmena témy → okamžite (theme-store)
  - Mazanie účtu — blokácia ak: `bookings.status IN (signed, in_progress, funded)` alebo
    `escrow_transactions.state IN (created, pending, disputed)` →
    `"Najprv uzavri všetky aktívne brigády a vyber zostatok z peňaženky."`

- **Dáta:** `users` (meno, email, telefón, avatar), `theme-store` (jazyk, téma,
  notifikácie — AsyncStorage), `consent_log` (GDPR súhlasy s verziou + timestamps).

- **Stavy:**
  - **push-denied** — badge pri notifikačnej sekcii: `"Notifikácie sú zakázané v
    nastaveniach systému"` + CTA `"Otvoriť nastavenia"`
  - **delete-blocked** — inline chyba pri pokuse zmazať s aktívnym bookingom
  - **delete-pending** — po potvrdení: `"Účet bude zmazaný do 30 dní. Do tej doby
    sa môžeš prihlásiť a zrušiť mazanie."` + CTA `"Zrušiť mazanie"`

- **Ref:** v2.7 §11 (GDPR — right to erasure, consent management); C-9 (dáta
  retencia; payroll dáta 10y → anonymizácia nie je možná pre aktívne zmluvy);
  E6 (OTP verify — zmena telefónu = nový OTP cyklus).

---

# Part B5 — Gamification & Brigzy Verified

> Systémová sekcia — nie jednotlivé obrazovky, ale herné mechaniky a dlhodobý
> Verified mód, ktoré sa prelínajú celou appkou. Vizuálne povrchy sú W12–W16
> (Worker profil, Brigy wallet, Referral, Premium). Tu je logika pod nimi.

---

## B5.1 XP & Rank systém

- **Účel:** Merať a odmeniť spoľahlivosť a aktivitu Worker-a. XP ovplyvňuje
  poradie v P4 (applicant ranking), odomyká Brigzy Verified, a dáva Workers
  viditeľný signál rastu.

- **Earn events (XP sources):**

  | Udalosť | XP |
  |---------|----|
  | Dokončená brigáda (escrow released) | +50 |
  | Celkové hodnotenie ≥ 4,5 za brigádu | +20 |
  | Celkové hodnotenie = 5,0 za brigádu | +30 (namiesto +20) |
  | Odoslanie hodnotenia (S7) | +10 |
  | Prvý DoVP/DoPČ (prvá "seriózna" brigáda) | +100 jednorazovo |
  | Dokončená Stripe Identity KYC (vrstva 2) | +200 jednorazovo |
  | Prijatý referral (pozvaný user dokončí 1. booking) | +150 |
  | Dokončený profil (avatar + bio + skills) | +30 jednorazovo |
  | Séria (streak) — 3 po sebe bez zrušenia | +50 bonus |

  XP sa **nedá stratiť** (iba earn, nikdy burn) — rank je trvalý signál dôvery.
  Výnimka: confirmed fraud/ban → rank reset (manuálne adminom).

- **Rank tiers:**

  | Rank | XP od | Názov | Farba / badge |
  |------|-------|-------|---------------|
  | 1 | 0 | Nováčik | Sivá |
  | 2 | 200 | Brigádnik | Zelená |
  | 3 | 600 | Skúsený | Modrá |
  | 4 | 1 500 | Expert | Fialová (clay purple) |
  | 5 | 3 500 | Elita | Zlatá |

  Rank badge viditeľný: W12 (vlastný profil) · W13 (verejný profil) · P4
  (applicant karta) · S1 chat header.

- **Dáta:**
  - `xp_events` — `id`, `user_id`, `reason`, `delta` (názvy per [[Data-Model]]),
    `ref_booking_id`, `created_at`
  - `users.xp` — denormalizovaný súčet (recount po každom `xp_events` insert)
  - `users.rank_tier` — computed z `xp` (int 1–5); precount pri uložení

---

## B5.2 Badge systém

- **Účel:** Doplnok k XP — konkrétne úspechy zviditeľnené na profile. Motivujú
  špecifické správanie (prvá brigáda, vernosť, referral) a dávajú Posterom
  rýchly signal o Worker-ovi.

- **Zoznam badges (MVP sada):**

  | Badge | Trigger | Ikona (návrh) |
  |-------|---------|---------------|
  | Prvé kroky | 1. dokončená brigáda | 🌱 |
  | Desiatka | 10 dokončených brigád | 🔟 |
  | Päťdesiatka | 50 dokončených brigád | 🏆 |
  | Päť hviezd | 5× po sebe hodnotenie 5,0 | ⭐ |
  | Spoľahlivý | 0 zrušení za posledných 10 brigád | 🛡 |
  | Early adopter | Registrácia pred [dátum launchu + 30 dní] | 🚀 |
  | Overený | Brigzy Verified schválený | ✅ |
  | Premium člen | Premium aktívne | 💜 |
  | Recruiter | 5 prijatých referralov | 🤝 |
  | Séria 5 | 5 brigád za sebou bez zrušenia | 🔥 |

- **Zobrazenie:** Grid na W12/W13; max 6 v gridu (ostatné za `"Zobraziť všetky"`);
  ťuknutie na badge → tooltip s názvom + popisom + dátumom získania.
  Nezískané badges: sivé / zamčené (viditeľné ako motivácia, nie skryté).

- **Dáta:**
  - `badges` — `id`, `key` (slug), `name`, `description`, `icon_url`
  - `user_badges` — `id`, `user_id`, `badge_key`, `earned_at`
  - Triggery: Supabase Edge Function / DB trigger pri insert do `bookings`
    (completed), `reviews`, `referrals`, `users` (premium, verified).

---

## B5.3 Brigzy Verified — kvalifikácia & proces

- **Účel:** Najvyššia úroveň dôvery na platforme. Verified Worker má prístup
  k inzertným listingom (B5.4), prioritu v P4 rankingu a Verified badge na
  verejnom profile. Je to dobrovoľné — Worker sa musí prihlásiť.

- **Kvalifikačné kritériá (všetky musia byť splnené):**

  | Kritérium | Prah |
  |-----------|------|
  | Dokončené brigády | ≥ 10 |
  | Priemerné hodnotenie | ≥ 4,5 ★ (min. 5 hodnotení) |
  | Stripe Identity KYC | Dokončená (vrstva 2 — doklad totožnosti) |
  | Overený telefón | Áno (E6) |
  | Žiadny aktívny ban / strike | `dispute_strikes < 3`, `frozen_at = null` |
  | Rank | ≥ Skúsený (600 XP) |

- **Proces (flow):**
  1. Worker otvorí W12 → sekcia `"Brigzy Verified"` → zobrazí checklist
     kritérií (zelená ✓ / šedá ○ per položka) + CTA `"Požiadať o Verified"`
     (aktívne len ak všetky kritériá splnené)
  2. Odoslanie žiadosti → `verified_applications.status = pending`; admin
     dostane notifikáciu v admin paneli (Part C)
  3. Admin review (1–3 prac. dni): schváliť → `users.brigzy_verified = true` +
     badge `Overený` + notifikácia Workerovi; zamietnuť → notifikácia s dôvodom
  4. Verified status je trvalý, kým nie je manuálne odobratý (admin, pri porušení)

- **Čo Verified odomyká:**
  - ✅ Badge `"Brigzy Verified"` na W13, P4 karte, S1 headeri
  - ✅ Prioritné zaradenie v P4 applicant rankingu (nad non-verified rovnakého XP)
  - ✅ Prístup k **inzertným listingom** (B5.4) — Posteri môžu oslovovať priamo
  - ✅ `"15-min náskok"` pred neprémiovými pri nových SOS brigádach (plus Premium)
  - ✅ Vyšší XP earn za každú brigádu (+10 bonus per booking)

- **Strata Verified:** len manuálne adminom pri závažnom porušení (potvrdený spor,
  fraud, kumulované strikes). Automatický downgrade nie je — zabraňuje edge-case
  strate pri technickej chybe.

- **Dáta:**
  - `users.brigzy_verified` (boolean), `users.verified_at` (timestamptz)
  - `verified_applications` — `id`, `user_id`, `status` (`pending`/`approved`/
    `rejected`), `reviewed_by` (admin user_id), `rejection_reason`, `created_at`,
    `reviewed_at`

---

## B5.4 Inzertný mód (Brigzy Verified — long-term listings)

- **Účel:** Druhý obchodný mód platformy — popri escrow marketplace môžu Verified
  Workers zverejniť **inzertný profil** (dostupnosť, sadzba, skills) a B2B Posteri
  ich môžu aktívne vyhľadávať a oslovovať. Brigzy tu zarába cez **platené listingy**
  alebo **kontaktný kredit** (nie escrow poplatok). Escrow stále voliteľné ak sa dohodnú.

  > **Priorita buildu:** nižšia ako escrow MVP — inzertný mód sa aktivuje po
  > stabilizácii core escrow loop. Feature flag `brigzy_verified_enabled`.

- **Worker strana — Inzertný profil (rozšírenie W12/W13):**
  Verified Worker môže aktivovať `"Inzertný profil"` v W12:
  - Dostupnosť (kalendár — voľné dni/týždne, hodinová kapacita/týždeň)
  - Preferovaná sadzba (od X €/h)
  - Skills tags (multi-select zo zoznamu: sklad, gastro, IT, stavba…)
  - Krátke bio (max 200 znakov, odlišné od bežného profilu)
  - Viditeľnosť: `"Verejný inzertný profil"` toggle (on/off kedykoľvek)

  Inzertný profil = rozšírenie W13 (verejný profil) — Poster vidí navyše sekciu
  `"Dostupnosť & sadzba"` ak je inzertný profil aktívny.

- **Poster strana — Browse Verified Workers (nová tab/screen, B2B only v MVP):**
  - Nová tab v Poster shelli: `"Hľadať brigádnikov"` (vedľa `"Moje brigády"`)
  - Filter: skills, dostupnosť (dátum), sadzba od–do, lokalita, rating
  - Výsledky: karty Verified Workers (avatar, meno, skills, rating, sadzba, dostupnosť)
  - Ťuknutie → rozšírený W13 profil; CTA `"Osloviť"` → otvára S1 chat priamo
    (systémová správa: `"[Poster firma] ťa oslovila cez inzertný profil"`)
  - Ak sa dohodnú → Poster zadá brigádu cez P2 (štandardný escrow flow) alebo
    bez escrow (direct hire — fáza 3, vyžaduje ďalšie právne posúdenie)

- **Monetizácia inzertného módu (fáza 2, nie MVP):**
  - Poster platí **kontaktný kredit** za `"Osloviť"` (napr. 1 €/kontakt), alebo
  - Worker platí za **zvýraznenie profilu** v browse výsledkoch (Brigy alebo €), alebo
  - Subscription pre Postera (`"Brigzy Hire"` plán — neobmedzené kontakty/mes)
  - Konkrétny model závisí od trakcie — rozhodnutie v čase aktivácie feature flagu

- **Dáta:**
  - `worker_listing_profiles` — `id`, `user_id`, `bio`, `preferred_rate`,
    `skills[]`, `weekly_capacity_hours`, `is_active`, `updated_at`
  - `worker_availability` — `id`, `user_id`, `date`, `available` (boolean)
    (alebo range-based: `available_from`, `available_to`)
  - `listing_contacts` — `id`, `poster_id`, `worker_id`, `conversation_id`,
    `credit_charged` (boolean), `created_at`

- **Stavy (Worker inzertný profil):**
  - **not-verified** — sekcia zamknutá s `"Dostupné po získaní Brigzy Verified"`
  - **verified-inactive** — toggle off, profil neviditeľný pre Posterov;
    CTA `"Aktivovať inzertný profil"`
  - **active** — viditeľný v browse; Worker vidí `"Viditeľný pre zadávateľov"`
    badge + počet zobrazení (last 30 dní)
  - **contacted** — notifikácia pri každom `"Osloviť"` od Postera

- **Ref:** v2.7 §2.2 (Brigzy Verified); §6 (monetizácia — inzertný mód ako druhý
  príjmový stream popri escrow); DECISION-3 ✅ (inzertný mód je IN tohto rebuildu,
  za feature flagom); Admin Panel Part C (feature flag `brigzy_verified_enabled`).

---

# Part C — Admin Panel (interný web)

> Plná špecifikácia v separátnom súbore: **`docs/design/Admin-Panel-Spec.md`**

Interný webový nástroj pre Brigzy tím — štatistiky, správa userov/brigád/escrow,
riešenie sporov (S8), odpoveď na support chat (S11), feature flags, exporty.
Prístupný len pre whitelistovaných adminov. Stack: Next.js + Supabase priamo.
Dizajn: Apple-style (čistý, biely, Inter/SF Pro, subtle shadows).
