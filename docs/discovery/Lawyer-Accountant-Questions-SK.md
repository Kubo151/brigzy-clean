---
title: Otázky pre právnika a účtovníka — Brigzy.sk
type: discovery
status: action-needed
updated: 2026-06-03
---

# Otázky pre právnika a účtovníka — Brigzy.sk

Cieľom je vyjasniť a potvrdiť právne, daňové, odvodové a účtovné otázky platformy ešte pred spustením reálnych platieb. Medzičasom sme spracovali právnu rešerš (stav k 6/2026); pri každej téme uvádzame náš pracovný záver a prosíme o jeho potvrdenie alebo korekciu, prípadne o dodanie/schválenie vzorov. Podklady predstavujú zámer produktu, nie právne stanovisko.

Identifikácia objednávateľa: Renewo, IČO: 57476080, kontaktná osoba: David Krescanko. Spoločnosť momentálne NIE je platiteľom DPH.

Stručný kontext platformy: Brigzy je on-demand trhovisko krátkodobých brigád. Platforma vystupuje výhradne ako technologický sprostredkovateľ (nie zamestnávateľ ani agentúra dočasného zamestnávania). Platby idú cez Stripe Connect (escrow), Brigzy nikdy nedrží prostriedky. Sú dva režimy: krátkodobý (escrow) a dlhodobý (inzertný, financie mimo platformy).

# ČASŤ A — PRÁVNE OTÁZKY

## A1. Zmluvný model — potvrdenie matice a vzorov zmlúv
Náš pracovný záver: aplikácia automaticky vygeneruje správny zmluvný typ podľa typu zadávateľa a povahy práce (pre používateľa je to jedno kliknutie):
- B2C (firma ↔ brigádnik), práca vymedzená jednorazovým výsledkom → Dohoda o vykonaní práce (DoVP, §226 ZP).
- B2C, opakovaná činnosť (čašník, sklad, upratovanie) → Dohoda o pracovnej činnosti (DoPČ, §228a).
- C2C (občan ↔ občan), hmotne/nehmotne zachytený výsledok (dielo) → Zmluva o dielo (§631–643 OZ).
- Čistá Zmluva o dielo pre všetky prípady = neprípustná (riziko švarcsystému).
Otázky:
- Potvrdzujete túto maticu ako správnu?
- Viete dodať alebo schváliť vzory DoVP, DoPČ a Zmluvy o dielo?
- Aké kritériá použiť na odlíšenie „diela" od „závislej práce" (chceme to zabudovať do automatickej klasifikácie úloh)?
- Aké znenie disclaimeru o zodpovednosti za správnu klasifikáciu odporúčate?
- Je SZČO (faktúra) tiež čisté riešenie a kedy hrozí preklasifikovanie na závislú prácu?

## A2. Postavenie Brigzy, sprostredkovateľská zmluva a splnomocnenie
Náš pracovný záver: zamestnávateľom je vždy zadávateľ (firma), nikdy Brigzy. Brigzy je len sprostredkovateľ a nesmie prácu riadiť. Brigzy nikoho neprihlasuje a neplatí odvody — firma prihlasuje brigádnika (RLFO najneskôr pred začatím práce), platí odvody a zráža daň. Brigzy môže firme technicky pomôcť (vygenerovať XML pre poisťovňu na jedno kliknutie).
Otázky:
- Potvrdzujete, že Brigzy nie je zamestnávateľ ani agentúra dočasného zamestnávania?
- Aké znenie sprostredkovateľskej zmluvy Brigzy–zadávateľ a plnej moci na úkony voči SP/ZP odporúčate?
- Ak Brigzy generuje/podáva RLFO v mene firmy na základe plnej moci, ako rozdeliť zodpovednosť za chyby a omeškanie?
- GDPR: Brigzy ako sprostredkovateľ spracúva rodné čísla pre firmu — akú zmluvu (čl. 28) potrebujeme?
- Počítadlo limitu 350 h/rok je per zadávateľ — aké upozornenia/limity máme zabudovať?

## A3. Escrow a platby (Stripe Connect) — licencovanie
Náš pracovný záver: peniaze idú cez Stripe Connect (drží ich Stripe Technology Europe Ltd., autorizovaná EMI, ref. C187865), Brigzy nikdy nedrží prostriedky → bez potreby licencie NBS. „Escrow" realizujeme cez oneskorené/manuálne výplaty.
Otázky:
- Potvrdzujete, že pri tomto nastavení Brigzy nepotrebuje licenciu platobnej inštitúcie/EMI?
- Odporúčate konzultáciu s Inovačným hubom NBS pre písomné potvrdenie?
- Ako nastaviť min. výber (15 €) a čas výplaty vo VOP v súlade so splatnosťou odmeny (DoVP po dokončení; DoPČ do konca nasledujúceho mesiaca)?

## A4. Digitálne zmluvy a elektronický podpis
Náš pracovný záver: zmluvy uzatvárame v aplikácii cez checkbox + tlačidlo a ku každej generujeme nezmeniteľný audit log (IP, časová pečiatka, Device ID, overené tel. číslo). KEP nie je nutný.
Otázky:
- Postačuje checkbox + tlačidlo + audit log (úroveň SES) pre platnosť DoVP/DoPČ, alebo potrebujeme zdokonalený podpis (AdES)?
- Potvrdzujete dostatočnosť tohto procesu pre DoVP, DoPČ aj Zmluvu o dielo?
- Kto zodpovedá za archiváciu a aké sú lehoty (mzdové doklady 10 r., mzdový list 50 r., osobný spis do 70 rokov veku)? Akú rolu má Brigzy ako úložisko?

## A5. Storno podmienky
Náš pracovný záver: fixná 20 % pokuta voči brigádnikovi-spotrebiteľovi je pravdepodobne absolútne neplatná (neprijateľná podmienka). Nahrádzame ju reputačným/ranking systémom a obmedzením zobrazovania ponúk pri opakovaných no-show (3 absencie = trvalý ban). Pri neskorom zrušení zo strany B2B zadávateľa prepadá dohodnutá časť escrow v prospech brigádnika ako kompenzácia.
Otázky:
- Potvrdzujete neplatnosť 20 % peňažnej pokuty voči spotrebiteľovi?
- Schvaľujete náhradný mechanizmus (reputácia/ranking + prípadná náhrada preukázateľných nákladov)? Aké znenie odporúčate do VOP?
- Je prepadnutie dohodnutej časti escrow v prospech brigádnika pri zrušení zo strany B2B zadávateľa v poriadku?

## A6. KYC a AML
Náš pracovný záver: pri Stripe Connect (Brigzy nedrží peniaze) Brigzy nie je povinná osoba; AML/KYC rieši Stripe. Rodné číslo zbierame až pri vzniku DoVP, nie pri registrácii.
Otázky:
- Potvrdzujete status „trhovisko, nie povinná osoba"?
- Je naše nakladanie s rodným číslom (až pri DoVP, šifrované, nezverejňované) v poriadku?

## A7. GDPR
Otázky:
- Potrebujeme DPIA pre GPS a anti-fraud (Device-ID)? Aké balančné testy?
- Aké DPA (čl. 28) potrebujeme so Stripe, mapovými službami, hostingom, e-podpisom, push/SMS; a SCC pri prenose mimo EÚ?
- Odporúčate oddelené VOP a privacy policy pre B2B a B2C?

## A8. Dlhodobý inzertný režim (neskoršia fáza)
- Pri čistom inzertnom modeli (bez escrow) potvrdzujete, že postačuje disclaimer vo VOP (strany si zmluvu, prihlásenie a odvody riešia samy) + nepovinné vzory zmlúv na stiahnutie?

# ČASŤ B — ÚČTOVNÉ A DAŇOVÉ OTÁZKY

## B1. DPH — aktuálny stav a registrácia
Náš pracovný záver: servisný poplatok (napr. 2 € + ~10 %) aj reklama podliehajú základnej sadzbe DPH 23 % — ale až po registrácii za platiteľa. Registrácia (od 1.1.2025): pri obrate 50 000 €/kalendárny rok platiteľ od 1. dňa nasl. roka; pri prekročení 62 500 € v prebiehajúcom roku ihneď.
Otázky:
- Potvrdzujete, že do registrácie neúčtujeme DPH na servisný poplatok?
- Ako máme sledovať obrat a kedy presne sa registrovať? Aká je pokuta za neskorú registráciu?
- Pri cezhraničných B2C službách — uplatní sa režim OSS? A reverse charge pri B2B v EÚ?

## B2. Účtovanie escrow a servisného poplatku
Náš pracovný záver: peniaze idú cez Stripe Connect a Brigzy ich nikdy nedrží (drží ich Stripe).
Otázky:
- Ako účtovať toky cez Stripe — ako prechodné (cudzie) prostriedky, alebo ako výnos?
- Kedy presne vzniká zdaniteľný výnos platformy (pri zložení do escrow, pri uvoľnení, alebo pri pripísaní servisného poplatku)?

## B3. Zdaňovanie príjmu brigádnika
Otázky:
- Ako sa zdaňuje príjem podľa modelu: DoVP/DoPČ (cez firmu — §5 závislá činnosť, preddavok 19/25 %), SZČO (faktúra), C2C príležitostný príjem (oslobodenie do 500 €/rok)?
- Aké doklady potrebuje brigádnik pre daňové priznanie a vieme mu ich z platformy generovať (PDF prehľad príjmov)?

## B4. Odvody
Náš pracovný záver: pri B2C odvody rieši firma (zadávateľ); Brigzy nikoho neprihlasuje a neplatí odvody.
Otázky:
- Potvrdzujete, že platforme nevznikajú odvodové ani oznamovacie povinnosti?
- Aké sú odvody pri DoVP/DoPČ pri nepravidelnom vs. pravidelnom príjme a aká je odvodová odpočítateľná položka (študent/dôchodca)?

## B5. Fakturácia
Náš pracovný záver: keďže nie sme platiteľ DPH, faktúry za servisný poplatok vystavujeme bez DPH.
Otázky:
- Aké náležitosti má mať faktúra za servisný poplatok voči B2B zadávateľom teraz (bez DPH) a čo sa zmení po registrácii za platiteľa?
- Ako riešiť doklady voči C2C zadávateľom (fyzické osoby)?

## B6. Interná peňaženka a výplaty
Otázky:
- Aký je účtovný a daňový pohľad na internú peňaženku (zostatky brigádnikov vedené cez Stripe) a na výplaty cez SEPA?
- Sú nejaké dôsledky pri minimálnom limite výberu 15 € a pri kumulovaní prostriedkov?

## B7. Reporty pre používateľov
Otázky:
- Aký obsah a formát PDF prehľadu príjmov pre brigádnikov je postačujúci ako podklad pre daňové priznanie?
- Aký formát CSV/XML exportu pre firmy je kompatibilný s bežnými účtovnými softvérmi (Pohoda, Kros) a aké údaje má obsahovať?

## B8. Registračné a evidenčné povinnosti
- Aké daňové, účtovné alebo evidenčné registrácie potrebuje Brigzy/Renewo zabezpečiť pred spustením reálnych platieb?

# ČASŤ C — SPOLOČNÉ

## C1. Demo verzia (právne aj účtovné potvrdenie)
- Potvrdzujete, že demo bez reálnych peňazí a reálnej práce (Stripe test mode, fiktívne dáta) nemá licenčné, pracovnoprávne, účtovné ani daňové riziko?
- Čo ak beta verzia zbiera reálne osobné údaje reálnych používateľov (GDPR)?
