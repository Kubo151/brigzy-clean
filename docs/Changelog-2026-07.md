---
title: Changelog — build sessions 5.–7. júla 2026
type: changelog
status: living
updated: 2026-07-07
---

# Changelog — 5.–7. júl 2026

> Všetko, čo sa zmenilo v kóde, DB a infraštruktúre počas build sessions
> (Claude + Kubo). Commity: `e4a2a48`, `57477b1`, `732d98a`, `be5e4bb`, `10fc465`.

## 🟣 Escrow loop — kompletný (P4 → S5 → S3 → release → W8)

### Edge funkcie (Supabase, demo mód — bez Stripe, kontrakt pripravený na swap)
| Funkcia | Čo robí |
|---|---|
| `select-applicant` | Poster vyberie brigádnika → vytvorí booking (`escrow_pending`), prihláška → accepted. Poplatok **2 € + 10 %**. Hodinovka: suma = sadzba × odhadované hodiny. |
| `fund-escrow` | S5 platba → escrow záznam (`pending`, held), booking → `awaiting_signatures`. Simulovaný charge (`demo_` payment intent id). |
| `sign-contract` | Mock OTP podpis (**123456**), poster podpisuje PRVÝ (enforced), obaja → contract `signed` + booking `in_progress`. Zapisuje `contract_otp_events` + audit log. |
| `attendance` | Check-in / check-out (poster) → `bookings.check_in_at/out_at` + `attendance_events`. QR sken neskôr použije ten istý endpoint. |
| `release-escrow` | Poster schváli → escrow `cleared`, booking `cleared`, kredit do `wallet_ledger` brigádnika. Hodinovka: výplata = sadzba × skutočné hodiny (zaokrúhlené ↑ na 15 min), zvyšok `refunded_to_poster_cents`. |

### Nové obrazovky
- **`booking/[id]`** — P5/W6 hub (role-aware): clay timeline (úschova → podpisy → pracovný deň → výplata), akcie podľa stavu a roly, check-in/out tlačidlá, S5 sheet reuse.
- **`booking/[id]/sign`** — S3 zmluva: VZOR disclaimer, preview Zmluvy o dielo, mock OTP input.
- **`EscrowConfirmSheet`** — S5 sheet: rozpis odmena/poplatok/spolu, platba, success stav.

### Upravené obrazovky
- **P4 `job-employer/[id]`** — ranking uchádzačov (verified×500 + rating×100 + XP), stat chipy (★ / XP / Overený), „Vybrať brigádnika" → S5; pill „Čaká na podpisy" → hub.
- **`wallet/index`** — mock dáta preč; balance = suma `wallet_ledger`, pending z aktívnych bookingov, mesačné štatistiky, reálne transakcie.
- **`my-applications`** — prijatá prihláška s bookingom → otvára booking hub.
- **`(tabs)/add`** — nové povinné pole „Odhadovaný počet hodín" pri hodinovej sadzbe.

## 🗄️ Databáza
- **Migrácia 007**: `jobs.estimated_hours` + backfill z duration textu („6 hodín (18:00…)" → 6).
- Seed: `wallet_ledger` pre luciu (135 € základ), demo štatistiky obnovené (lucia 850 XP/★4.7/verified, marek 120 XP/★4.2) — pôvodné sa stratili pri testovaní 23.6.
- Demo dáta: 1 kompletný cleared booking (marek↔lucia, Čašník) ako história.

## 🐛 Opravené bugy
1. **Role switch crash** („Rendered fewer hooks than expected") — `(tabs)/index.tsx` a `(tabs)/add.tsx` mali early return pred hookmi → rozdelené na samostatné komponenty.
2. **Web login úplne nefunkčný** — anon key vo Vercel env vars mal neviditeľný BOM znak (U+FEFF) → browser odmietal hlavičky. `supabase.ts` teraz sanituje env hodnoty.
3. **5 starých TS chýb** (account, apply, login, CategoryPill, seed) — opravené; `tsc` je zase zelený gate.
4. **tsc crash na Node 24** — workaround `node --stack-size=8000 …` zdokumentovaný v CLAUDE.md.
5. **Git author email** mal chýbajúci @ (`nemcikjakub5gmail.com`) → Vercel blokoval deploye; opravené globálne.

## 🚀 Infraštruktúra
- **Vercel**: brigzy.vercel.app napojený na GitHub `Kubo151/brigzy-clean` — každý push na `master` = production deploy, PR = preview. `vercel.json` (expo SPA export, `--legacy-peer-deps`, cache headers), `app.json` web output `single`.
- **Supabase MCP konektor** prepojený na správny projekt (`dygjwtljgzfyoqdklcrk`) — edge funkcie sa nasadzujú priamo.
- **Stripe konektor** pripojený (účet „Brigzy"). Na reálne test platby treba vložiť `STRIPE_SECRET_KEY` do Supabase → Edge Functions → Secrets; mení sa potom len vnútro `fund-escrow`/`release-escrow`.

## 🧪 Testy (všetko na produkcii)
- REST E2E: celý loop fix aj hodinovka (36 € escrow → 0,25 h → 2,25 € payout, 33,75 € refund ✓).
- Chrome E2E: login → role switch → P4 ranking → S5 → podpisy oboch → release → wallet kredit ✓.

## 📌 Známe veci / ďalšie kroky
- QR dochádzka (W7/S6) — tlačidlá hotové, QR sken je kozmetika navrch.
- S7 review, W1 mapa, P2 wizard s auto-deriváciou zmluvy — podľa Demo-Build-Plan.
- Nadčas nad odhad hodín = S4 Dodatok (post-demo).
- Browser autofill sa bije s login formulárom (pri deme vyčistiť polia).
- Demo účty: lucia/marek/jana/pavel `@demo.brigzy.sk`, heslo `Brigzy2026!`, OTP `123456`.
