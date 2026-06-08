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
> Done so far: **B1, B2 (Worker)**. Next: B3 Poster, B4 shared, B5 gamification.

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
