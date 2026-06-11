---
title: Project Status — where we are / resume here
type: status
status: living
updated: 2026-06-07
---

# Project Status — Brigzy.sk

> Read this first on any new session. One-screen summary of where we are and what happens next.

## 🔑 Resume phrase (owner pastes this to start a new conversation)
> *„Pokračujeme na Brigzy. Najprv si načítaj projektovú pamäť: `C:\WORK\brigzy-clean\docs\Project-Status.md` a `docs\00-INDEX.md`, plus `C:\Claude-memory\brigzy.md`. Účtovník potvrdil, WAITING skončil — sme CLEARED TO BUILD (od právnika čakáme už len vzory zmlúv, non-blocking). Ideme detailne plánovať ako appka funguje/vyzerá a potom prerábame celú appku. Zhrň kde sme a opýtaj sa čo ďalej."*

**Obsidian vault location (personal):** `C:\Claude-memory\` (note: `brigzy.md`).
**Detailed project vault:** `C:\WORK\brigzy-clean\docs\` (this folder).

## ▶️ RESUME HERE (2026-06-12)
**[[UX-Spec]] is COMPLETE** — B1 Entry/Auth · B2 Worker · B3 Poster · B4 Shared sheets
(S9 insurance ⏸ paused pending FinExpert agreement) · B5 Gamification/Verified ·
Part C → [[Admin-Panel-Spec]] (interný Next.js admin web).
**Spec audit done + fixes applied (2026-06-11/12)** — [[Spec-Audit-2026-06-11]]:
escrow prepnutý na okamžitý charge + delayed transfer (7-dňový limit manual capture),
poradie **fund → sign** zjednotené (A6/S3/S5/API), [[Data-Model]] rekoncilovaný
k UX-Spec B4/B5/Part C, admin audit log (`admin_actions`) povýšený do MVP.
**→ Next: potvrdiť [[Demo-Build-Plan-26-06]]** (14-dňový rez na demo 26.6.) s Davidom
a začať stavať — Day 1–2 = i18n rozhodnutie + DB migrácie + Stripe spike + route tree.
**Contract templates (2026-06-07):** `docs/reference/Brigzy_Sablony_Zmluv.docx` — example
only, NOT lawyer-verified (C-1 open); demo ich používa s vodoznakom „VZOR".

## What we're building
**Brigzy.sk** — an on-demand short-term-work ("brigády") marketplace for Slovakia (a
**Renewo** project, IČO **57476080**, lead **David Krescanko**; Renewo is **not a VAT
payer** yet). Workers find nearby jobs, agree in chat, and money is protected by
**Stripe-based escrow**; trust via KYC, two-way reviews, XP. Full picture: [[Product-Summary]].

## ▶️ Current state (2026-06-07): CLEARED TO BUILD
- **Discovery:** done. **Design:** done & approved (claymorphism — Purple Clay light + Dark
  Clay dark; 10-screen mockups in [[Design-System]]).
- **Architecture:** decided — Expo + Supabase + **Stripe (Connect for escrow, Stripe for
  KYC)**; Brigzy never holds funds. ADRs 0001–0005.
- **Accountant: CONFIRMED.** Owner got the combined doc back from the účtovník (2026-06-07);
  Part B (accounting/tax) + most of Part A working conclusions are validated. The waiting phase
  is over — **no blocker remains.**
- **Legal:** the only outstanding item is the **contract templates** (how DoVP/DoPČ/Zmluva o
  dielo should be worded) from the lawyer — **non-blocking**, work proceeds in parallel.
- **Code:** owner has green-lit the **full rebuild** of the app ("rebuild the entire app, like
  we talked"). Next step = detailed planning pass, then build.
- **Canonical spec: [[Brigzy-Spec-v2.7]]** (2026-06-07) — supersedes v2.5. Adds accountant
  consultation outputs + 8 legal fixes (350h counter, 3-layer KYC, AdES signing, Brigy
  non-convertibility, cross-sell/Dodatok, FinExpert insurance, two-tier fee). Section 13 = full
  lawyer/accountant Q&A status (most ✅ answered in-doc).

## ⛔ Blocked on
**Nothing blocking.** Only open item (parked, non-blocking): final **contract templates**
(DoVP / DoPČ / Zmluva o dielo wording) from the lawyer. Everything else needed to start the
rebuild is in place. Combined doc: **`docs/discovery/Brigzy-Otazky-pravnik-uctovnik.docx`**
(Part A = právne, Part B = účtovné/daňové, Part C = demo). Source: [[Lawyer-Accountant-Questions-SK]].

## ▶️ What happens when they confirm
1. Flip the relevant [[Legal-Compliance-Register]] items RESEARCHED → VERIFIED; finalize ADR-0005.
2. **Plan in detail how the app works + looks** (full UX + flows + the planned rebuild incl.
   real KYC) — owner wants a proper planning pass here, "and many other things". 😄
3. Build the **Purple/Dark claymorphism RN component kit**, then reskin/rebuild on the
   Expo + Supabase + Stripe foundation, per [[Development-Roadmap]].

## Parked / later
- Long-term **advertising/listings** mode (after a verified-worker base) — [[Business-Model]].
- **Brigzy Coins** / referral reward model — [[Feature-Ideas]].
- Web admin/stats dashboard; ads; Premium; insurance (FinExpert); multi-country.
- The **26.6.2026** demo date is at risk given the wait + planned rebuild (R-9) — revisit when advisors confirm.
