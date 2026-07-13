---
title: Changelog — build sessions 5.–12. júla 2026
type: changelog
status: living
updated: 2026-07-12
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

## 📌 Známe veci / ďalšie kroky (stav k 7.7.)
- QR dochádzka (W7/S6) — tlačidlá hotové, QR sken je kozmetika navrch.
- S7 review, W1 mapa, P2 wizard s auto-deriváciou zmluvy — podľa Demo-Build-Plan.
- Nadčas nad odhad hodín = S4 Dodatok (post-demo).
- Browser autofill sa bije s login formulárom (pri deme vyčistiť polia).
- Demo účty: lucia/marek/jana/pavel `@demo.brigzy.sk`, heslo `Brigzy2026!`, OTP `123456`.

---

# Pokračovanie — 8.–12. júl 2026

> Commity: `60cd775`, `713d169`, `648b453`, `2f544e3`, `1cf29a9`, `0a84bbc`, `09c48cd`, `7c7147d`,
> `a8c4f49`, `b5d95d5`. Zaznamenané spätne 12.7. (owner nemal čas priebežne diktovať pamäť).

## 8. júl — W7/S6 QR dochádzka + P2 wizard
- **QR attendance (W7/S6)** — rotujúci QR check-in/out podľa UX-Spec, na existujúcom `attendance` endpointe.
- **P2 post-job wizard** — `(tabs)/add.tsx` prepísaný z jednostránkového formulára na 7-krokový wizard
  (Kategória → Popis s Firma/Súkromná osoba prefill z `companies` → Odmena s live fee preview →
  Miesto → Rozvrh → Nastavenia → Súhrn s auto-derivovaným typom zmluvy). `sign-contract` edge fn opravená
  aby odvodzovala typ zmluvy podľa v2.7 §3 namiesto natvrdo `zmluva_o_dielo`. E2E overené (B2B+Výsledok →
  DoVP, C2C → Zmluva o dielo bez ohľadu na task_nature).

## 12. júl — chat dospel: médiá, reakcie/edit/delete, cenové vyjednávanie
- **Chat foto + hlasové správy** — `messages.media_path` (privátna storage cesta) + `media_duration_seconds`,
  nový privátny bucket `chat-media` (RLS: uploader + obe strany správy). Fotoaparát/galéria, mikrofón cez
  `expo-audio`. Web gotcha: `ImagePicker` `asset.uri` je na webe `blob:` bez prípony → extension sa berie
  z `asset.mimeType`.
- **Avatar bucket fix** — `avatars` bucket v produkčnom Supabase vôbec neexistoval (upload padal potichu);
  navyše sa `avatar_url` zapisoval len do `auth.users` metadát, nie do `public.users` (odkiaľ ho číta chat/
  verejný profil/zoznam uchádzačov). Obe opravené.
- **Chat reakcie/edit/delete** — `messages.edited_at`/`deleted_at` (soft delete s tombstone), tabuľka
  `message_reactions` (1 reakcia/user/správa), long-press bottom sheet s 6 emoji + Upraviť/Vymazať.
- **Bezpečnostná oprava RLS (security review)** — Postgres RLS UPDATE politiky gatujú len *riadky*, nie
  *stĺpce`. Sender mohol cez `.update()` prepísať ľubovoľný stĺpec vlastnej správy vrátane `media_path` →
  keďže storage RLS pre `chat-media` povoľuje čítanie obom stranám správy odkazujúcej na danú cestu, dalo sa
  takto vygenerovať signed URL na cudzí objekt v bucket-e (IDOR). Fix: `BEFORE UPDATE` trigger, ktorý
  vynucuje presný column-scope (sender: len `content`/`deleted_at`; receiver: len `read`). Pozri
  [[feedback_rls_patterns]] pre všeobecný vzor.
- **Právne dokumenty od právnika** — 12 v1 šablón zmlúv (DoVP/DoPČ/ZoD/VOP/DPA/atď.) + 6 v2 šablón
  označených právnikom ako "final", plus kompletná dátová mapa appky (screeny + DB schéma + storage +
  edge funkcie + spracovatelia) pre právnu/účtovnú kontrolu. **Spôsob podpisu je teraz uzamknutý:
  vlastnoručne+foto ALEBO KEP/eID** — owner zámerne necháva mock SMS-OTP flow v appke, kým šablóny nie sú
  definitívne finálne.
- **S2 cenové vyjednávanie v chate** — `negotiate-price` edge fn na `price_negotiations` (propose/accept/
  reject, max 3 kolá; nová ponuka počas čakajúceho kola = automatický reject predošlej a počíta sa ako
  protiponuka; odpovedať môže len protistrana posledného navrhovateľa; len na `status='pending'`
  prihláškach). Prijatie zapíše `applications.negotiated_rate_cents`, ktoré už `select-applicant` číta →
  booking automaticky preberie dohodnutú sadzbu. Pripnutý panel nad chat inputom ukazuje živý stav
  vyjednávania. `job-employer` karty uchádzačov dostali ikonu správy (predtým nemal poster ako napísať
  uchádzačovi). E2E overené naživo.
- **Fix: dohody miznuli po reloade** — RLS pre `price_negotiations` kontrolovala len `applications.
  worker_user_id`, ale apply flow zapisoval len legacy `worker_id` → `worker_user_id` ostávalo `null`,
  brigádnik po refreshi stratil celú históriu vyjednávania (aj už dohodnuté). Fix: RLS aj zápis teraz
  fallback-ujú cez oba stĺpce (`worker_id`/`worker_user_id`, `employer_id`/`poster_user_id`) — **pozor,
  tento vzor legacy/nový stĺpec sa v schéme opakuje, neber ako dané že je vyplnený len nový stĺpec.**
