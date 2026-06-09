---
title: UX Spec — Navigation, IA & Screen Inventory — Brigzy.sk
type: design
status: draft (in progress — IA first, screen detail to follow)
version: target spec v2.7
updated: 2026-06-07
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
> Done so far: **B1, B2 (Worker), B3 (Poster)**. Next: B4 shared sheets, B5 gamification.

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
- **Stavy:** awaiting-signature (blocking banner), awaiting-poster-funding, in-progress, disputed,
  cancelled, completed-awaiting-review. **Ref:** the spine in A6.

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
