---
title: Admin Panel Spec — Brigzy.sk (interný web)
type: design
status: draft
version: v1.0
updated: 2026-06-11
---

# Admin Panel — Brigzy.sk

> Interný webový nástroj pre Brigzy tím. **Nie je verejne prístupný** — autentifikácia
> cez whitelist, žiadna verejná registrácia. Priame napojenie na Supabase databázu.
> Referencia na mobilnú app: [[UX-Spec]] Part B4 (S8 disputes, S11 support chat).

---

## 1. Technický stack

| Vrstva | Technológia | Dôvod |
|--------|-------------|-------|
| Framework | **Next.js 15** (App Router) | Server Components, file routing, Vercel deploy |
| Databáza | **Supabase JS** priamo (service role key na serveri) | Rovnaká DB ako mobil, žiadna extra API vrstva |
| Auth | **Supabase Auth** + admin whitelist | `users.is_admin = true` — RLS policy blokuje všetkých ostatných |
| UI | **shadcn/ui** + Tailwind CSS | Apple-style komponenty out-of-the-box, rýchly vývoj |
| Tabuľky | **TanStack Table v8** | Sorting, filtering, pagination serverside |
| Grafy | **Recharts** | Jednoduché, ľahké, composable |
| Realtime | Supabase Realtime (subscribe na support_messages, disputes) | Live updates v support chate a sporoch |
| Deploy | **Vercel** (private, password-protected deployment alebo Vercel Access) | Rýchly, zero-config |

---

## 2. Autentifikácia & prístup

- Login: email + heslo cez Supabase Auth (rovnaká auth ako mobil)
- Po logine: server-side check `users.is_admin = true` — ak false → 403 page
- **Whitelist** adminov: manuálne nastavený priamo v DB (`UPDATE users SET is_admin = true WHERE email = '...'`)
- Session: Supabase session cookie (7 dní); po vypršaní → redirect na `/login`
- Žiadna verejná registrácia — `/login` je jediná verejná stránka
- **Vercel deployment:** nastavený ako `Preview` s Vercel Authentication (extra vrstva
  hesla navyše) alebo custom domain s IP whitelist (napr. len SK IP)
- Service role key (pre server-side operácie mimo RLS) uložený len v Vercel env vars,
  nikdy v client bundle

---

## 3. Dizajn

**Apple-style** — čistý, minimalistický, funkčný:

- **Farby:** biela (`#FFFFFF`) background, `#F5F5F7` sidebar + cards, `#1D1D1F` text,
  `#0071E3` primary action (Apple blue), červená pre danger/dispute, oranžová pre warning
- **Typografia:** Inter (fallback ak SF Pro nedostupné); 14px base, 13px tabuľky,
  12px labels; font-weight 500 pre headery
- **Layout:** fixný ľavý sidebar (240 px) + hlavný content area; sidebar collapsible
  na mobile (tablet podpora nice-to-have, nie požiadavka)
- **Tiene:** `box-shadow: 0 1px 3px rgba(0,0,0,0.08)` na cards — jemné, nie dramatické
- **Tabuľky:** riadky s hover `#F5F5F7`, selected row modrý ľavý border, žiadne
  vertikálne čiary (len horizontálne oddeľovače)
- **Status pills:** rounded-full, farebné pozadia s 15% opacity (zelená/oranžová/červená/sivá)
- **Prázdne stavy:** centrovaná ilustrácia + popis + CTA (nie blank white)

---

## 4. Navigácia (sidebar)

```
🏠  Dashboard
👥  Useri
💼  Brigády
📋  Bookings & Escrow
⚖️  Spory
💬  Support
🔔  Notifikácie
📊  Exporty
⚙️  Nastavenia
```

Každá sekcia = samostatná Next.js route (`/admin/users`, `/admin/disputes`, atď.).

---

## 5. Sekcie — detail

---

### 5.1 Dashboard

- **Účel:** Okamžitý prehľad zdravia platformy — jeden pohľad bez klikania.

- **KPI cards (top row, 4 karty):**
  - `Aktívni useri` — registrovaní za posledných 30 dní (delta vs predchádzajúci mesiac)
  - `Aktívne brigády` — job status = active (delta)
  - `Escrow held` — suma v `escrow_transactions.status = funded` (€)
  - `Payout volume` — suma `released` tento týždeň / tento mesiac (toggle)

- **Grafy (druhý riadok):**
  - Line chart: nové registrácie / deň (posledných 30 dní) — Worker vs Poster
  - Bar chart: escrow volume / týždeň (posledných 12 týždňov)

- **Live activity feed (pravý panel):**
  Posledných 20 udalostí v reálnom čase (Supabase Realtime):
  `"[Meno] sa zaregistroval/a"` · `"Nový spor #[ID]"` · `"Escrow uvoľnený: X €"` ·
  `"Nová aplikácia na [Brigáda]"` — každý riadok s timestampom + deep-link na detail.

- **Quick actions:**
  `"Odoslať broadcast notifikáciu"` · `"Exportovať mesačný report"` · `"Feature flags"`

---

### 5.2 Useri

- **Zoznam:** TanStack Table — stĺpce: Avatar · Meno · Email · Rola (Worker/Poster/Oboje) ·
  Registrácia · KYC status · Rating · Dispute strikes · is_admin · Posledná aktivita.
  Filter: rola, KYC status, is_admin, dátumový rozsah, fulltext search (meno/email).

- **Detail usera** (`/admin/users/[id]`):**
  Dve záložky — **Profil** (všetky `users` fields editovateľné, vrátane `is_admin` toggle)
  a **Aktivita** (timeline: registrácia, brigády, bookings, escrowy, spory, hodnotenia,
  support tickety). Actions: `"Poslať notifikáciu"` · `"Zmraziť účet"` (soft ban —
  `users.frozen_at`) · `"Zmazať účet"` (spustí GDPR soft-delete flow) ·
  `"Pridať / odobrať admin"`.

- **KYC detail:** zobrazí stav všetkých troch vrstiev (Stripe Connect, Stripe Identity,
  Brigzy payroll form); pre payroll dáta — zobrazí len posledné 4 cifry r.č. a ZP kód
  (nie full decrypt v UI — citlivé dáta).

---

### 5.3 Brigády

- **Zoznam:** stĺpce: Názov · Poster · Kategória · Zmluva typ · Sadzba · Sloty ·
  Status · Vytvorená · SOS (badge) · Poistenie.
  Filter: status (active/draft/closed/expired), kategória, dátum, B2B/C2C, SOS.

- **Detail brigády** (`/admin/jobs/[id]`):
  Všetky polia + zoznam aplikácií + zoznam bookingov; actions:
  `"Zatvoriť brigádu"` · `"Upraviť"` (override limit — admin môže editovať viac polí
  ako Poster) · `"Zvýšiť viditeľnosť"` (bez Brigy, manuálny boost).

---

### 5.4 Bookings & Escrow

- **Zoznam:** stĺpce: ID · Worker · Poster · Brigáda · Escrow (€) · Escrow status ·
  Booking status · Zmluva podpísaná · Dátum.
  Filter: escrow status, booking status, dátumový rozsah.

- **Detail bookingu** (`/admin/bookings/[id]`):
  Status timeline (rovnaká ako W6/P5 ale read-only); zmluva PDF download;
  `attendance_events` tabuľka (check-in/out, GPS); escrow história;
  **Manuálne akcie (len admin):**
  - `"Uvoľniť escrow Worker-ovi"` → Stripe capture (s confirm dialogom + dôvod)
  - `"Refundovať Posterovi"` → Stripe refund (s percentom + dôvod)
  - `"Označiť ako dokončené"` (override ak Poster nereaguje)

---

### 5.5 Spory

- **Účel:** Hlavný pracovný nástroj supportu — fronta otvorených sporov, evidence
  viewer, resolution actions.

- **Zoznam — queue view:**
  Karty (nie tabuľka) zoradené podľa `created_at` (najstarší hore). Každá karta:
  Spor ID · Worker meno + avatar · Poster meno + avatar · Brigáda · Kategória ·
  Čas od otvorenia · Status pill · Assigned agent.
  Filter: status (open/info_requested/resolved), kategória, assigned/unassigned.

- **Detail sporu** (`/admin/disputes/[id]`):
  **Ľavý panel (2/3 šírky):**
  - Popis + dôkazy (fotky v grid, klikateľné na full-screen)
  - Automatické dôkazy: zmluva (PDF link) · attendance log (tabuľka) ·
    posledných 50 správ z chatu (read-only, chronologicky) · escrow história
  - Vyjadrenia oboch strán (z `dispute_messages`) — timeline view

  **Pravý panel (1/3 šírky):**
  - Info: worker, poster, brigáda, escrow suma, čas otvorenia
  - **Resolution actions:**
    - `"Uvoľniť Worker-ovi (100 %)"` — červené tlačidlo s confirm
    - `"Refundovať Posterovi (100 %)"` — červené tlačidlo s confirm
    - `"Split"` — input field `"Worker dostane X %"` (slider 0–100) + confirm
    - `"Zamietnuť spor"` — escrow uvoľnený Worker-ovi, spor closed-no-action
  - Resolution note (textarea, povinná pred každou akciou) — viditeľná pre obe strany
  - `"Vyžiadať info"` → status = `info_requested` + notifikácia userovi
  - `"Priradiť mne"` → `disputes.support_agent_id = current_admin`

---

### 5.6 Support chat

- **Účel:** Inbox všetkých support konverzácií (S11 z mobilu). Tím odpovedá priamo
  odtiaľto.

- **Zoznam konverzácií (ľavý panel):**
  List zoradený podľa poslednej správy; unread badge (správy od usera bez odpovede);
  filter: open/resolved, linked-to-dispute. Každý riadok: avatar · meno · preview ·
  čas · unread badge · dispute tag ak prepojené.

- **Chat panel (pravý panel):**
  Rovnaké bubliny ako S11 v mobilu ale desktop layout; meno agenta sa zobrazuje
  userovi ako `"Brigzy Support"` (nie meno konkrétneho agenta — anonymizované).
  Vstupný bar: textarea (enter = newline, Cmd+Enter = send) + attach + send button.
  `"Označiť ako vyriešené"` → `support_conversations.status = resolved` + notifikácia
  userovi.
  Ak konverzácia má `dispute_id` → sticky banner `"Spor #[ID]"` s linkom na 5.5.

- **Supabase Realtime:** subscribe na `support_messages` kde `conversation_id = X` →
  nové správy sa objavia bez refresh.

---

### 5.7 Notifikácie

- **Broadcast:** Formulár — segment (Všetci / len Workers / len Posteri / konkrétny
  user ID); title + body + deep_link (optional); preview card ako sa zobrazí v mobile;
  CTA `"Odoslať"` → Edge Function batch insert do `notifications` + Expo push.

- **História broadcastov:** tabuľka odoslaných (dátum, segment, title, počet príjemcov).

---

### 5.8 Exporty

- **Mesačný report:** Sumarizácia (počet brigád, bookings, escrow volume, payout volume,
  servisné poplatky, nový useri) — CSV alebo PDF.
- **Mzdové podklady (override):** Admin môže generovať export za akéhokoľvek Postera
  (pre prípad technického problému) — rovnaká logika ako P9.
- **Raw export:** ľubovoľná tabuľka → CSV (s filtrom dátumového rozsahu).

---

### 5.9 Nastavenia

- **Feature flags:** toggle list — `insurance_enabled` · `brigzy_verified_enabled` ·
  `ai_support_bot_enabled` (fáza 2) · `maintenance_mode` (zobrazí interstitial
  v mobile appke). Každý flag: názov, popis, aktuálna hodnota, kto naposledy zmenil + kedy.

- **Servisný poplatok:** edit pásmá (Pásmo 1 flat €, Pásmo 2 % threshold + rate) —
  zmena sa prejaví v reálnom čase v P2 fee preview na mobile.

- **VAT status Brigzy:** toggle `vat_registered` (prepína logiku generovania faktúr
  v P8 — bez DPH / s 23 % DPH).

- **Admin whitelist:** zoznam adminov (meno, email, posledný login), pridanie/odobranie
  (`is_admin` flag na `users`).

---

## 6. Dátový model — admin-špecifické polia

Polia pridané do existujúcich tabuliek pre potreby admin panela:

| Tabuľka | Pole | Typ | Popis |
|---------|------|-----|-------|
| `users` | `is_admin` | boolean | Admin prístup |
| `users` | `frozen_at` | timestamptz | Soft ban — app odmietne login |
| `users` | `dispute_strikes` | int | Počet potvrdených porušení |
| `disputes` | `support_agent_id` | uuid FK | Pridelený admin |
| `feature_flags` | celá tabuľka | — | `key`, `value` (boolean/json), `updated_by`, `updated_at` |
| `broadcast_log` | celá tabuľka | — | `id`, `sent_by`, `segment`, `title`, `body`, `recipient_count`, `sent_at` |
| `admin_actions` | celá tabuľka | — | **Audit log — MVP** (per [[Spec-Audit-2026-06-11]]): `admin_user_id`, `action`, `entity_type`, `entity_id`, `payload_json`, `created_at` |

> **⚠️ Pravidlo pre money akcie (2026-06-12):** Manuálny release / refund / split
> z panela **nikdy nemutuje DB priamo cez service role** — volá tie isté Edge
> Functions ako mobilná appka (`/bookings/release`, refund flow…). Idempotencia,
> escrow state machine aj audit log tak zostávajú na jednom mieste. Service role
> sa používa len na čítanie a ne-money zápisy (flagy, user fields).

---

## 7. Non-goals (MVP)

- Mobilná verzia admin panela — desktop only
- Role-based access control v rámci adminov (napr. junior support vs senior) — všetci
  admini majú rovnaké práva v MVP
- Automatické AI riešenie sporov — manuálne v MVP

> ~~Audit log každej admin akcie — nice-to-have~~ → **presunuté do MVP** (2026-06-12,
> [[Spec-Audit-2026-06-11]]): nástroj, ktorý vie hýbať peniazmi, musí logovať každú
> akciu od prvého dňa. Tabuľka `admin_actions` v sekcii 6.
