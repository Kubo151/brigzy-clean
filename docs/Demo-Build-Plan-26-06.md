---
title: Demo Build Plan — 26.6.2026 (14-dňový rez)
type: plan
status: proposed (čaká na potvrdenie ownera + Davida)
updated: 2026-06-12
---

# Demo Build Plan — 26.6.2026

> **Toto je REZ, nie celý rebuild.** [[UX-Spec]] = plný cieľ (~50 obrazoviek);
> demo 26.6. = jedna naskriptovaná šťastná cesta cez escrow loop v Stripe test mode,
> v claymorphism dizajne, na reálnych zariadeniach. Publikum: marketing + investori.
> Všetko mimo IN scope sa po deme stavia ďalej podľa UX-Spec.

**Zostáva: 14 dní (12.6.–25.6.), demo 26.6.** · 2 devs (Kubo, Oliver) + AI.
**Deľba:** Dev A = UI/screens · Dev B = backend/escrow/Edge Functions · AI = scaffolding,
komponenty, copy, seed dáta, debugging.

---

## Scope

### ✅ IN (demo ukazuje)

| Flow | Obrazovky (UX-Spec) | Poznámka |
|------|---------------------|----------|
| Auth | E1, E3, E4, E5 (E6 OTP **fake-verify** v teste) | Onboarding carousel E2 = static, skippable |
| Worker discovery | W1 mapa + W2 list + W3 detail | Radius filter, SOS badge; W4 filters zjednodušené |
| Apply + chat | apply → S1 auto-open thread | Realtime správy (Supabase Realtime už funguje v prototype) |
| Poster post + select | P2 wizard (kroky 1,2,3,5,7 — bez poistenia/visibility) + P1 zjednodušený + P4 | Auto-derivácia typu zmluvy = highlight pre investorov |
| Escrow | S5 fund (test karta) → P5/W6 stavy | **Okamžitý charge** per [[ADR-0002-escrow-stripe-connect]] (fix 2026-06-11) |
| Zmluva | S3 preview + OTP podpis (test OTP = mock SMS) | Generovaný PDF z draft šablón (C-1 disclaimer vodoznak "VZOR") |
| QR dochádzka | W7 show + S6 scan | Nonce rotácia reálna — efektný demo moment |
| Release + wallet | P5 release → W8 wallet kredit | Transfer v test mode |
| Review | S7 blind review + reveal | Reveal animácia = demo moment |
| Role switch | W12 prepínač Worker↔Poster | Jeden účet, dve roly — kľúčový koncept |

### ❌ OUT (po deme, podľa UX-Spec)

Admin panel (Part C) · B5 gamifikácia ako systém (XP/rank na profile **staticky
seedované**, žiadne earn engine) · inzertný mód (B5.4) · S9 poistenie (⏸ FinExpert) ·
S2 cenová negociácia · S4 Dodatok · S8 dispute (UI button → "coming soon" toast) ·
S11 support · P6 cross-sell · P7 plný escrow prehľad · P8/P9 faktúry+exporty ·
W9–W11 payout/Connect onboarding/PDF (wallet len zobrazuje kredit) · W14–W16
Brigy/referral/Premium · 350h counter (P4 banner staticky nasimulovaný v seed dátach
— ukázať, nepočítať) · multi-slot group chat · S10 plný feed (push len lokálne).

> **Demo trik:** veci čo sú OUT ale vyzerajú dobre (350h warning, XP badge, Brigy
> ticker na W7) ukážeme **staticky cez seed dáta** — investor ich vidí, nemusia žiť.

---

## Harmonogram

### Dni 1–2 (12.–13.6.) — Základy + rozhodnutia
- **Rozhodnúť i18n: jeden systém** (odporúčanie: `useText`/texts.ts — jednoduchší,
  SK/EN stačí; `useI18n`/translations.ts zmraziť, nemigrovať staré screeny teraz).
- Nová DB schéma per [[Data-Model]] (migrácie od začiatku — `supabase migration`).
- Dev B: Stripe test účet + Edge Functions skeleton + webhook + prvý PaymentIntent
  (okamžitý charge!) end-to-end spike.
- Dev A: route tree podľa UX-Spec (E/W/P/S názvy), legacy screeny vypnúť z navigácie
  (nemazať — len odpojiť). Clay kit (`src/components/clay/`) = základ, doplniť
  chýbajúce komponenty (Sheet, StatusPill, Timeline).
- AI: seed skript (10 jobov v Bratislave s GPS, 4 useri, hotové bookings pre W5/P1).

### Dni 3–6 (14.–17.6.) — Core loop, každý svoju polovicu
- Dev B: `confirm` (charge) → `release` (transfer) → wallet ledger → webhooky;
  contracts/generate + sign (OTP mock cez DB flag, nie reálne SMS).
- Dev A: E-flow + W1 mapa + W2/W3 + apply/S1 chat + P2 wizard + P4.
- **GATE (17.6. večer): escrow happy-path zelený v teste cez API (bez UI).**

### Dni 7–10 (18.–21.6.) — Spojenie + zvyšok cesty
- S5 fund sheet + S3 sign screen + W6/P5 hub stavy (fund→sign poradie!) +
  W7/S6 QR (nonce server + camera scan) + S7 review + W8 wallet.
- Role switch + P1 dashboard (zjednodušený).
- **GATE (21.6. večer): celá cesta klikateľná na zariadení, end-to-end.**

### Dni 11–12 (22.–23.6.) — Hardening
- Empty/loading/error stavy na demo ceste (nie celej appke). Clay konzistencia.
- Test na low-end Androide + iOS (cez development build, nie Expo Go — SDK 56).
- Sentry. Seed dáta finálne (mená, fotky, sumy ktoré dobre vyzerajú na projektore).

### Dni 13–14 (24.–25.6.) — Demo readiness
- **Naskriptovaný demo scenár** (kto kliká čo, na ktorom zariadení, v akom poradí —
  napísaný dokument, 2× nácvik). Dve zariadenia: jedno Worker, jedno Poster.
- EAS buildy. Záložný plán: screen-recording videá každého kroku (keby zlyhala
  sieť/Stripe na mieste).
- "TEST MODE — žiadne reálne peniaze" labeling (R-10).

### Riziká plánu
- **Najužšie hrdlo = Dev B escrow track.** Ak gate 17.6. nezelený → okamžite zrezať
  S3 OTP na klik-podpis a QR na statický (rozhodnúť hneď, nie 20.6.).
- iOS testovanie cez dev build (App Store Expo Go je stále SDK 54). Ak iOS build
  zlyhá → demo na 2× Android, iOS len video.
- P2 wizard má 7 krokov — v deme staviame 5; ak nestíha, zrezať na 3 (popis+suma+publish).

---

## Po deme (poradie, podľa UX-Spec + [[Spec-Audit-2026-06-11]])
1. Dokončiť core: S2 negociácia, S4 Dodatok, S8 dispute, W9–W11 payouts/Connect, 350h engine
2. Admin panel ([[Admin-Panel-Spec]]) — potrebný pre S8/S11
3. B5 gamifikácia ako živý systém
4. S9 po dohode s FinExpertom · inzertný mód za flagom
