---
title: Spec Audit — nálezy z revízie dokumentácie (Fable 5)
type: review
status: ✅ RESOLVED — všetky opravy aplikované 2026-06-12 (viď log nižšie)
updated: 2026-06-12
---

# Spec Audit — 2026-06-11

> Revízia celého vaultu po dokončení UX-Spec (B1–B5 + Part C admin panel).
> Prešlo: [[UX-Spec]], [[Admin-Panel-Spec]], [[Data-Model]], [[API-Design]],
> [[Legal-Compliance-Register]], [[Development-Roadmap]], [[Project-Status]],
> [[Brigzy-Spec-v2.7]], štruktúra kódu v `src/`.
>
> **Stav: nálezy NEOPRAVENÉ — čaká sa na rozhodnutie ownera, čo púšťame.**
> Zoradené od najvážnejšieho.

---

## 1. ⚠️ KRITICKÉ — Stripe `capture_method: manual` má ~7-dňový limit

**Kde:** [[UX-Spec]] S5 + [[API-Design]] `/bookings/confirm`.

S5 aj API-Design špecifikujú PaymentIntent s manual capture — capture až pri
release. Lenže **neodchytená autorizácia expiruje po ~7 dňoch**. Brigáda zadaná
týždeň dopredu, viacdňová brigáda, alebo Poster schvaľujúci na 8. deň →
autorizácia prepadne, capture zlyhá.

[[ADR-0002-escrow-stripe-connect]] pritom správne hovorí iný mechanizmus:
„escrow = delayed/manual **payouts**, hold na connected accounte do 90 dní".

**Odporúčanie:** zjednotiť na *separate charges & transfers*:
charge hneď pri fundingu (peniaze reálne strhnuté) → držané na platforme /
connected accounte → „release" = transfer/payout → „zrušenie" = skutočný refund.
Mení mechaniku refundov v S5/P7. Opraviť: ADR-0002 (potvrdiť), API-Design, S5.

---

## 2. Rozpor v jadre flow — fund PRED podpisom, alebo PO?

| Zdroj | Poradie |
|-------|---------|
| A6 diagram (chrbtica) + P5 timeline + S5 | výber → **fund** → **sign** |
| [[API-Design]] state machine (`awaiting_signatures → escrow_pending`) | **sign** → **fund** |
| S3 stav „both-signed" („Poster → S5") | sign → fund |

S3 a S5 na seba ukazujú navzájom (S5 success → S3; S3 signed → S5) — kruh.

**Odporúčanie: fund → sign** (sedí s A6, P5, S5; Poster fundovaním dokazuje
vážnosť; full refund pred podpisom je triviálny). Opraviť: API-Design state
machine + CTA „both-signed" v S3.

---

## 3. Data-Model.md sa rozišiel s UX-Spec B4/B5/Part C

UX-Spec B4 sheety zaviedli tabuľky nekonzistentné s [[Data-Model]]
(rekoncilovaný k v2.7 ešte pred B4):

| Obrazovka | UX-Spec | Data-Model | Konflikt |
|-----------|---------|------------|----------|
| S2 | `price_negotiations` (rounds 1–3, na `application_id`) | `price_proposals` (na `conversation_id`) | iný kľúč aj statusy |
| S1 | `conversation_participants`, system messages, `type` direct/group | `conversations.is_group`, pozn. „multi-slot = V2" | group chat je v core (v2.7, P3) |
| S5 | escrow `funded/released` | `pending/cleared` (aj API) | terminológia chrbtice |
| S7 | kategórie hodnotení, `revealed_at`, 14-dňová expirácia | len rating+comment+`is_visible` | chýbajú polia |
| S8 | kategórie, evidence, `resolved_split` + %, `dispute_messages`, strikes | minimálny disputes, split nepozná | chýba veľa |
| S6 | `qr_nonces` tabuľka, `scanned_by` | chýbajú | doplniť |
| S11 + Part C | `support_conversations/messages`, `is_admin`, `frozen_at`, `feature_flags`, `broadcast_log` | vôbec nie sú | doplniť |
| B5 | `xp_amount`, `users.xp_total` | `delta`, `users.xp` | drobné názvy |
| S10 | `deep_link`, `entity_id/entity_type`, `read_at` | `data_json`, `read bool` | drobné |

**Odporúčanie:** jeden rekonciliačný prechod Data-Model.md. Väčšinou vyhráva
UX-Spec (mladší, detailnejší), ALE escrow terminológiu nechať podľa
Data-Model/API (`pending/cleared`) a opraviť UX-Spec.

---

## 4. Demo 26.6.2026 je o 15 dní — chýba „build-plan rezu"

[[Development-Roadmap]] je provizórny (24-dňový šprint, prerámcovaný).
UX-Spec = full rebuild (~50 obrazoviek + admin panel) — to sa za 15 dní nepostaví.

**Návrh rezu pre demo:**
- **IN:** clay shell + auth (E1–E6 zjednodušene) · feed/mapa (W1–W3) · post wizard
  (P2 skrátený) · apply → select → escrow test-mode → mock zmluva s OTP → QR →
  release → review. Jedna šťastná cesta, naskriptovaná, seedované dáta.
- **OUT:** admin panel · B5 gamifikácia (XP len staticky) · inzertný mód · S9 ·
  P8/P9 exporty · S11 · referraly · Premium.

Bez rezu sa tím rozbehne do šírky a 26.6. nebude nič celé.

---

## 5. Admin panel — dve korekcie

1. **Audit log admin akcií** je v [[Admin-Panel-Spec]] non-goals — pre nástroj,
   ktorý vie manuálne uvoľniť/refundovať peniaze, patrí do MVP. Jedna tabuľka
   `admin_actions`, lacná, pri spore/regulácii na nezaplatenie.
2. Manuálny release/refund **nemá mutovať DB priamo cez service role** — má volať
   tie isté Edge Functions ako appka (`/bookings/release`…). Idempotencia, state
   machine a logy zostanú na jednom mieste.

---

## 6. Menšie nálezy

- **[[Project-Status]] zastaraný** — „RESUME: Part B3" (hotové B3, B4, B5, Part C).
  Hlavička UX-Spec tiež („Done so far: B1, B2, B3" + status draft/IA-first).
- **i18n:** dva paralelné systémy (`useText` vs `useI18n`) — pri rebuilde vybrať
  JEDEN hneď, každá nová obrazovka pridáva stringy.
- **B5 XP za Premium (+50/mes):** kupovanie XP za peniaze špiní trust signál,
  ktorý P4 ranking používa na výber ľudí. Premium nech dáva viditeľnosť, nie XP.
- **S12 mazanie účtu:** doplniť, že payroll dáta v zmluvách prežívajú zmazanie
  účtu (10r retencia, C-9) — anonymizuje sa profil, nie zmluvy.
- **Legacy kód:** duplicitné routes (`home.tsx` vs `(tabs)/index`,
  `job-detail.tsx` vs `job/[id]`) — pri rebuilde čistý route tree podľa UX-Spec,
  legacy zabiť skoro; clay komponenty (`src/components/clay/`) a stores recyklovať.
- Preklep v B5.3: „potvrdenýspor".

---

## ✅ Log aplikovaných opráv (2026-06-12)

1. **Escrow mechanizmus** ✅ — okamžitý charge + delayed transfer: [[ADR-0002-escrow-stripe-connect]]
   (krok 2/4/5 prepísané), [[API-Design]] (`confirm`/`release`/`recompute`), [[UX-Spec]] S5.
2. **Fund → sign** ✅ — [[API-Design]] state machine (`escrow_pending → awaiting_signatures`),
   UX-Spec S3 (post-sign → `in_progress`, CTA opravené), W6 stavy preusporiadané.
3. **Data-Model rekonciliácia** ✅ — `price_negotiations` (nahradil `price_proposals`),
   conversations+participants+system messages (group = core), reviews (kategórie,
   `revealed_at`, 14d), disputes rozšírené + `dispute_messages` + strikes, `qr_nonces` +
   attendance polia, contracts sign polia + `contract_otp_events`, notifications polia,
   nová sekcia B4/B5/Part C (support, verified, listing, admin tabuľky). Escrow
   terminológia zjednotená na `state` `pending/cleared` (UX-Spec opravený).
4. **Demo build-plan** ✅ — [[Demo-Build-Plan-26-06]] (14-dňový rez, IN/OUT, gates 17.6./21.6.).
5. **Admin panel** ✅ — `admin_actions` audit log povýšený do MVP; money akcie cez Edge
   Functions, nie priame DB zápisy ([[Admin-Panel-Spec]] §6 + non-goals).
6. **Drobnosti** ✅ — [[Project-Status]] refresh, UX-Spec hlavička/“Done so far”, XP za
   Premium odstránené (trust signál), S12 retencia zmlúv po zmazaní účtu, preklep,
   `xp_events.delta`/`users.xp` zjednotené.
