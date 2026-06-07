---
title: Brigzy.sk — Projektová špecifikácia v2.7 (canonical)
type: reference
status: canonical
version: "2.7"
source: docs/reference/Brigzy_Specifikacia_v2.7.docx
updated: 2026-06-07
supersedes: Brigzy-Spec-v2.5.md
---

# Brigzy.sk — Projektová špecifikácia platformy (v2.7)

> **Canonical produktová špca.** Markdown prepis dodaného `Brigzy_Specifikacia_v2.7.docx`
> (Jún 2026, vlastník Dávid Krešćanko). v2.7 dopĺňa výstupy z konzultácie s **účtovníkom**;
> v2.6 zapracovala 8 právnych opráv z rešerše. Nahrádza [[Brigzy-Spec-v2.5]].
>
> Stav: účtovník potvrdil → **CLEARED TO BUILD**. Od právnika ostávajú už len **vzory zmlúv**
> a vybrané znenia/licenčné otázky (FinExpert) — non-blocking. Governance pravidlo platí:
> ❓ položky v sekcii 13 sú na finálne potvrdenie odborníkom; tracking v [[Legal-Compliance-Register]].

## Prehľad zmien v2.5 → 2.6 → 2.7

| # | Sekcia | Zmena |
|---|--------|-------|
| 1 | 3.2 | Oprava: príležitostný príjem (oslobodenie 500 €/rok) platí len pre čisté C2C |
| 2 | 3.3 | AdES (OTP) + PDF doručenie kópie zmluvy stranám |
| 3 | 6 (nová) | Právna klasifikácia internej meny Brigy — zákaz konvertibility na EUR |
| 4 | 4 (nová) | Oddelenie Stripe KYC od vlastného formulára Brigzy (r.č., ZP) |
| 5 | 3.1 | Sledovanie limitu 350 h + automatický prechod na DoPČ |
| 6 | 2.2 | Disclaimer zodpovednosti pre inzertný (dlhodobý) režim |
| 7 | 10 | DPA so Stripe/Google Maps + DPIA pre GPS a Device ID |
| 8 | 9.1 | Právna výhrada k propagácii poistenia FinExpert pred licenčným overením |
| 9 | 3.3 | Tok podpisovania — fyzický (BOK) aj elektronický, blokovanie bez podpisu |
| 10 | 3.1 | Vstupné pole počtu hodín pri registrácii + kumulatívna evidencia (350 h) |
| 11 | 4 | KYC formulár: povinné údaje pre SP/ZP, GDPR súhlas s prenosom zamestnávateľovi |
| 12 | 6 | Dvojúrovňový cenový model servisného poplatku (paušál + %) |
| 13 | 9.5 | Cross-sell — opakovaná brigáda u toho istého zamestnávateľa cez escrow |
| 14 | 10.1 | Integrácia poistenia s Universal (FinExpert) — auto-odoslanie, checkbox opt-out |

---

## 1. Architektúra systému a používateľské roly

Brigzy = on-demand digitálne trhovisko práce, sprostredkúva kontakt medzi zadávateľmi a
brigádnikmi. **Výhradne technologický sprostredkovateľ** — nie zamestnávateľ ani agentúra
dočasného zamestnávania.

**1.1 Roly (Views)** — UI sa dynamicky mení podľa roly:
- **Zadávateľ – Firma (B2B):** PO a živnostníci. Fakturačné údaje (IČO, DIČ, IČ DPH). Správa
  inzerátov, hromadný výber, export mzdových podkladov.
- **Zadávateľ – Jednotlivec (C2C):** súkromné FO, bez firemných údajov. Jednorazová výpomoc
  v domácnosti/záhrade → výhradne **Zmluva o dielo** pre práce s konkrétnym výsledkom.
- **Brigádnik (Worker):** FO hľadajúca zárobok. **Povinné KYC.** Mapa príležitostí, interný
  Wallet, konto mincí Brigy.

## 2. Produktová matica (režimy)

**2.1 Krátkodobý režim — core + Escrow.** Jednorazové/operatívne brigády (hodiny–dni). Povinný
Escrow cez Stripe Connect (peniaze zmrazené pred prácou, uvoľnené po dokončení). Biznis model:
servisný poplatok **2 € + 10 %** z každej úspešnej transakcie.

**2.2 Dlhodobý režim — inzertný „Brigzy Verified".** Inzercia dlhodobých/sezónnych prác a
stabilných pomerov. Financie **mimo platformy** (strany sa dohodnú priamo). Výhoda: profily
s **Brigzy Verified** (história krátkodobých prác, XP, hviezdičky). Biznis model: flat fee
9–35 € za inzerát alebo predplatné.

> ⚠️ **Disclaimer (oprava #6):** v inzertnom režime Brigzy poskytuje len inzertný priestor.
> Za právnu správnosť dohôd uzatvorených mimo platformy zodpovedajú výhradne strany. Brigzy
> nezodpovedá za pracovnoprávnu klasifikáciu. Musí byť explicitne vo VOP pre dlhodobý režim.

## 3. Právny rámec a automatizácia zmlúv (SR)

Aplikácia na pozadí vyhodnocuje typ subjektov + povahu práce a generuje správny typ zmluvy.

**3.1 B2C — Firma ↔ Brigádnik.** Prevádzkové činnosti pre firmy = znaky závislej práce (ZP).
Zmluva o dielo v B2C je **nezákonná**. Systém generuje:
- **DoVP (§226 ZP):** zadania vymedzené výsledkom (inventúra, jednorazová výpomoc). **Max. 350 h/rok** u jedného zadávateľa.
- **DoPČ (§228a ZP):** opakované činnosti vymedzené druhom práce (čašník, skladník, upratovačka). **Max. 10 h/týždeň** v priemere.

> ⚠️ Nesprávna klasifikácia = nelegálne zamestnávanie → pokuta **2 000 – 200 000 €** (z. č.
> 82/2005). Inšpektorát posudzuje reálny výkon, nie názov zmluvy. **Maticu musí schváliť právnik.**

**Sledovanie limitu 350 h (oprava #5 + #10):** počítadlo **per dvojica zadávateľ–brigádnik**
(nie globálne). Pri registrácii povinné pole „Koľko hodín ste už odpracovali u tohto
zamestnávateľa v aktuálnom roku? (0–349)" → počiatočný stav. Ďalšie hodiny kumulatívne cez QR
check-in/out. **Upozornenie pri 315 h (90 %)**, **auto-blok DoVP pri 350 h** → návrh prechodu na
DoPČ. Limit platí u každého zadávateľa osobitne.

**Povinnosti zadávateľa (vždy zamestnávateľ, nie Brigzy):** registrácia v SP (RLZ), prihlásenie
brigádnika cez **RLFO (kód 3 = DoVP)** pred začatím práce (§231 z.č. 461/2003), prihlásenie do ZP,
odvody (dôchodkové, úrazové, garančné, rezervný fond + zdravotné), preddavok dane 19/25 % (§35 ZDP).
*Brigzy pomáha:* KYC dáta → XML pre eSlužby SP; RLFO podáva v mene zadávateľa na **splnomocnenie**
(zodpovednosť nesie zadávateľ; znenie pripraví právnik).

**3.2 C2C — Jednotlivec ↔ Brigádnik.** **Zmluva o dielo (§631–643 OZ).** Len medzi nepodnikateľmi,
činnosti s hmatateľným výsledkom (kosenie, sťahovanie, montáž). Bez registrácie v poisťovniach.

> ⚠️ **Oprava #1:** oslobodenie príjmu do **500 €/rok** (§9 ods.1 g ZDP) platí **len pri čistom C2C**
> (zadávateľ nie je PO ani SZČO). Ak je zadávateľ firma/živnostník → príjem zo závislej činnosti,
> zdaňuje sa bez ohľadu na výšku. **V appke nezobrazovať 500 € oslobodenie plošne** — len pri reálnom C2C.

**3.3 Uzatváranie zmlúv (oprava #2 + #9).** Elektronicky: checkbox + tlačidlo záväzného podpisu.
- **Úroveň podpisu:** **AdES** — identita overená cez SMS/e-mail **OTP** (vyššia dôkazná sila než SES).
- **Audit log (nezmeniteľný):** IP, časová pečiatka (UTC), Device ID, hash verzie dokumentu, overené tel. číslo, ID Stripe účtu.
- **PDF kópia:** ihneď po podpise e-mailom obom stranám. Alternatíva: **fyzický podpis (BOK)** — vytlačiť, podpísať, priložiť scan.
- **Dodatok:** pri práci navyše (§9.5) auto-generovaný Dodatok, rovnaký podpisový proces.
- **Archivácia:** mzdové doklady 10 r., mzdové listy 50 r. Zodpovednosť = zadávateľ; Brigzy = technické úložisko.
- **Tok:** generuj zmluvu → zobraz plný text obom → podpis (OTP **alebo** scan) → bez podpisu **escrow sa nezablokuje** → zadávateľ archivuje min. 10 r.

## 4. KYC architektúra (oprava #4 + #11)

Trojvrstvový systém, každá vrstva iný účel:

| Vrstva | Náklad | Zbiera | Účel / obmedzenie |
|--------|--------|--------|-------------------|
| **Stripe Connect KYC** | v Connect zdarma | meno, adresa, dátum nar., IBAN | platobné (PSD2). Nestačí pre SP/ZP. |
| **Stripe Identity** | ~1,40 €/overenie (50 zdarma) | foto dokladu + selfie | voliteľné, pre vyšší objem |
| **Brigzy formulár** | zdarma | **rodné číslo, ZP, trvalý pobyt** | len pri vzniku DoVP/DoPČ. Čl. 6(1)(c) GDPR |

> ⚠️ Stripe **nezíska r.č. ani ZP** — nutné pre SP/ZP pri DoVP. Vlastný formulár sa aktivuje
> **až keď brigádnik akceptuje B2C brigádu**. Plošný zber r.č. pri registrácii **zakázaný** (§78 ods.4 z.č. 18/2018).

**Povinné údaje pre SP/ZP:** meno, dátum nar., r.č. (len pri B2C brigáde), trvalý pobyt, ZP
(VšZP/Dôvera/Union), IBAN. Bez nich systém nedovolí vytvoriť DoVP. **GDPR súhlas** s prenosom
údajov budúcemu zamestnávateľovi (granulárny, odvolateľný; čl. 6(1)(b)+(c)) — znenie pripraví právnik.

## 5. Finančná architektúra — Stripe Connect

> ✅ **Právne potvrdené:** Stripe Technology Europe Ltd. = autorizovaná EMI (CBI, ref. C187865),
> PSD2 passport do EHP. Peniaze sú vždy na Stripe Connected účtoch, **nie v účtovníctve Brigzy** →
> Brigzy **nepotrebuje** PI/EMI licenciu od NBS (z.č. 492/2009) pri zachovaní tejto architektúry.

Escrow stavy: **Pending** (zmrazené, delayed payout) → **Cleared** (práca schválená → Wallet) →
**Disputed** (spor, zmrazené do rozhodnutia podpory). Min. výber z Wallet: **15 €**. Splatnosť
odmeny po dokončení (§228 ods.1 ZP) — nadlimitné zadržiavanie vo Wallet neprípustné.

## 6. Biznis model a monetizácia

Poplatky podliehajú DPH **23 %** (z.č. 278/2024, od 1.1.2025) — **až po registrácii za platiteľa.**

| Poplatok | Režim | Výška (bez DPH) | Fakturačný moment |
|----------|-------|------------------|-------------------|
| Servisný | krátkodobý (escrow) | 2 € fix + 10 % | pri zložení do escrow |
| Inzertný | dlhodobý | 9–35 € | pri uverejnení inzerátu |
| B2B predplatné | dlhodobý | 30–99 €/mes | mesačne |
| Premium brigádnik | oba | 4,99 €/mes (al. 500 Brigov) | mesačne / mincami |

DPH registrácia: sledovať obrat od 1. dňa; 50 000 €/rok → platiteľ od 1.1. nasl. roka; 62 500 € →
ihneď. **Do obratu len servisný poplatok**, nie hodnota brigády. B2B SR: faktúra 23 %. B2B EÚ:
reverse charge. Premium výhody: ad-free, náskok 15 min na ponuky, vizuálny odznak.

**Dvojúrovňový model poplatku (oprava #12, otvorené — dopočítať pred MVP):** Pásmo 1 = paušál
(napr. 2–3 €) do hranice X €; Pásmo 2 = % (odporúčané 8–12 %) nad X €. Hranicu + sadzby stanoviť
podľa priemernej hodnoty brigády, nákladov Stripe (~1,4 % + 0,25 €), marže, konkurencie.

## 7. Gamifikácia — interná mena „Brigy"

Fixný pomer **100 Brigov = 1 €** (len nákup prémiových služieb v appke).

> ⚠️ **KRITICKÉ (oprava #3):** Brigy **NESMÚ** byť konvertibilné na EUR / vyberateľné na účet.
> Inak = vydávanie elektronických peňazí → **EMI licencia NBS** (z.č. 492/2009 §81). Brigy = výhradne
> interná lojalitná mena (Premium, topovanie). Obmedzenie uviesť v Pravidlách + Podmienkach.

**7.1 Earning:** +10/odpracovaná hodina (QR), +25 za 5★, +150 za referral, +50 mesačne pri ratingu ≥4.8.
**7.2 Spending:** Premium 30 dní = 500 Brigov; topovanie, odznaky. Neprenosné, bez nároku na refund v EUR.

## 8. Referral systém

**8.1** Unikátny odkaz `https://brigzy.sk/r/[ID]`, natívny share dialóg.
**8.2 Cyklus:** tracking cez cookies → registrácia+KYC (status Pending) → **tvrdá konverzia:** pozvaný
musí dokončiť a mať vyplatenú prvú reálnu escrow brigádu → odmena **150 Brigov** pozývateľovi + 150 pozvanému.
**8.3 Anti-fraud:** doživotný strop **600 Brigov** (4 priatelia), ďalej +100 XP bez mincí. Blokácia pri
zhode IBAN / tel. čísla / Device ID.

## 9. Kľúčové UX funkcie

- **9.1 Vyjednávanie ceny v chate:** brigádnik pošle protinávrh sadzby → zadávateľ akceptuje/odmietne →
  prepočet escrow + autorizácia doplatku. Zmena neplatí, kým nie je plne krytá v escrow.
- **9.2 SOS + lokalizácia:** mapa (Google Maps / Mapbox) podľa GPS; filter rádia 5/15/30 km; push. SOS =
  červený inzerát + masívna push do 5 km, vyšší poplatok.
- **9.3 Skupinové brigády (multi-slot):** N voľných miest, aktívne do obsadenia; skupinový čet; každý
  brigádnik vlastná DoVP/DoPČ (zdieľaná šablóna, individuálne údaje).
- **9.4 QR dochádzka:** dynamický šifrovaný QR; zadávateľ skenuje check-in/out; zápis času + GPS =
  dôkaz pri sporoch a výpočte Brigov.
- **9.5 Cross-sell + Dodatok (oprava #13):**
  - *Cross-sell:* po dokončení ponuka „zadať ďalšiu brigádu tomuto brigádnikovi" / „Pracovať znova" →
    opäť cez escrow → poplatok. Každá ďalšia brigáda = **nová DoVP/DoPČ** (auto-generovaná).
  - *Dodatok (práca navyše počas aktívnej brigády):* tlačidlo **[+ Pridať prácu navyše]** → popis + suma →
    notifikácia brigádnikovi → akceptácia → rozdielová suma do escrow → auto **Dodatok č. 1** k pôvodnej
    zmluve (rovnaký podpisový flow OTP/scan; bez potvrdenia sa suma neuvoľní). Hodiny sa pripočítajú k
    počítadlu 350 h. Dodatok **nemôže zmeniť typ** (DoVP→DoPČ), len rozšíriť predmet a odmenu.

## 10. Bezpečnosť, reputácia, storno

**10.1 Poistenie — FinExpert / Universal (oprava #8 + #14):** escrow brigády auto-kryté poistením
zodpovednosti za škodu. Nahlásenie: tlačidlo → AI bot zbiera foto → escrow zmrazený → maklér FinExpert.
Integrácia Universal: pri potvrdení brigády checkbox **opt-out** (predvybraný) „Chcem poistenie cez
FinExpert" → údaje auto cez API → potvrdenie e-mailom obom.

> ⚠️ Propagácia/sprostredkovanie poistenia môže vyžadovať **licenciu finančného agenta** (z.č. 186/2009).
> Pred spustením (aj testovacia verzia) **konzultácia s právnikom** + prípadná registrácia NBS. Alternatíva:
> Brigzy len odkazuje na FinExpert (nekomunikuje produkt) — rozlíšenie posúdi právnik.

**10.2 Storno + reputačné tresty:** finančné pokuty voči spotrebiteľom = **absolútne neplatné**
(§53 ods.4–5 OZ). Náhradný mechanizmus:
- **No-show brigádnika:** −100 Brigov, prudký pokles XP/rankingu, obmedzenie ponúk, **3 absencie = trvalý ban.** Žiadna peňažná pokuta.
- **Storno zadávateľom (B2C, spotrebiteľ):** >24 h → plná refundácia; 12–24 h → refund 80 % (20 % = náhrada preukázateľných nákladov); <12 h → refund 50 % (zvyšok = náhrada škody, **nie pokuta**).
- **Storno zadávateľom (B2B):** zmluvná pokuta **až 20 %** (§544 OZ / §300 ObchZ) je platná. Oddelené B2B podmienky; výšku potvrdiť s právnikom.

## 11. Regulačné — GDPR a AML (oprava #7)

**11.1 Právne základy + retencia:**

| Údaj | Základ | Doba | Pozn. |
|------|--------|------|-------|
| Rodné číslo | čl. 6(1)(c) | 10 r. / 50 r. (mzdový list) | až pri DoVP |
| GPS | čl. 6(1)(f) | po ukončení + vyúčtovaní | balančný test + DPIA |
| Device ID | čl. 6(1)(f) | trvanie účtu + sporová lehota | balančný test + DPIA |
| KYC foto | čl. 6(1)(b)+(c) | 5 r. po vzťahu | Stripe AML politika |
| Meno, e-mail | čl. 6(1)(b) | účet + 3 r. | privacy policy |
| Transakcie | čl. 6(1)(c) | 10 r. (z.č. 431/2002) | |

**11.2 Povinné GDPR dokumenty:** Privacy Policy (oddelená B2B/B2C); **DPIA** (povinné pre GPS + Device ID,
čl. 35); **DPA** (čl. 28) so Stripe, Google Maps/Mapbox, push (OneSignal/Firebase), e-mail/SMS
(SendGrid/Twilio), hosting; Register spracovateľských činností (čl. 30); SCC/DPF pri prenose mimo EÚ.

**11.3 AML (z.č. 297/2008):** operácie cez Stripe Connect → AML zodpovednosť (identifikácia, screening,
hlásenie) nesie **Stripe ako EMI**. Brigzy nie je povinná osoba (§5) — **len ak nikdy nedrží peniaze.**
Akýkoľvek vlastný wallet/kredit s držbou peňazí → Brigzy sa stáva povinným AML subjektom + licencia.

## 12. Roadmapa pred spustením

| Fáza | Aktivita | Priorita |
|------|----------|----------|
| OKAMŽITE | Advokát: matica zmlúv, VOP (B2B/B2C), splnomocnenie SP/ZP | 🔴 |
| OKAMŽITE | Právnik: FinExpert — licenčná povinnosť poistenia | 🔴 |
| PRED MVP | GDPR: DPIA (GPS+Device ID), DPA Stripe/Maps, privacy policy, register | 🔴 |
| PRED MVP | Stripe Connect — overiť architektúru, delayed payouts | 🔴 |
| PRED MVP | AdES (OTP podpis) + auto PDF doručenie | 🟠 |
| PRED MVP | Počítadlo 350 h + auto prechod DoVP→DoPČ | 🟠 |
| PRI MVP | DPH registrácia pri 50 000 €/rok (sledovať od 1. dňa) | 🟠 |
| FÁZA 2 | Dlhodobý inzertný režim: disclaimer, Brigzy Verified, vzory zmlúv | 🟡 |
| PRIEBEŽNE | Inovačný hub NBS: písomné stanovisko k Stripe Connect | 🟡 |

## 13. Status otázok pre právnika a účtovníka

> Plný tracker je v sekcii 13 docx. Skrátený stav (✅ = zodpovedané v dokumente, ❓ = na potvrdenie):

**Právne (A):** A1 maticu zmlúv ✅ (+ ❓ vzory = právnik) · A2 postavenie/splnomocnenie ✅ (+ ❓ znenia) ·
A3 escrow/NBS ✅ (+ ❓ NBS potvrdiť) · A4 podpis ✅ čiastočne (+ ❓ AdES vs SES, §40 ods.4 OZ) · A5 storno ✅ ·
A6 KYC/AML ✅ · A7 GDPR ✅ (+ ❓ vypracovať DPIA/DPA/VOP) · A8 inzertný disclaimer ✅.

**Účtovné (B):** B1 DPH ✅ čiastočne (+ ❓ OSS, miesto dodania) · B2 účtovanie escrow ❓ · B3 zdaňovanie
brigádnika ✅ čiastočne (+ ❓ SZČO, PDF obsah) · B4 odvody ✅ (+ ❓ sadzby 2026) · B5 fakturácia ✅ čiastočne ·
B6 Wallet účtovne ❓ · B7 PDF/CSV formáty ✅ funkcia (+ ❓ formát) · B8 registrácie pred spustením ❓.

**Spoločné (C):** C1 demo bez reálnych peňazí ✅ (+ ❓ formálne potvrdiť + GDPR pre beta s reálnymi údajmi).

> Hlavné otvorené pre **právnika**: vzory DoVP/DoPČ/ZoD, znenie splnomocnenia + sprostredkovateľskej
> zmluvy, VOP (B2B/B2C), GDPR súhlasy/DPIA, FinExpert licenčná otázka, formálne potvrdenie escrow/NBS.
> Pre **účtovníka**: účtovanie escrow toku + Wallet, presné DPH/OSS, sadzby odvodov 2026, formáty exportov,
> registrácie pred ostrým spustením.
