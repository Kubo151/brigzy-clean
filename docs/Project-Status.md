---
title: Project Status — where we are / resume here
type: status
status: living
updated: 2026-06-03
---

# Project Status — Brigzy.sk

> Read this first on any new session. One-screen summary of where we are and what happens next.

## 🔑 Resume phrase (owner pastes this to start a new conversation)
> *„Pokračujeme na Brigzy. Najprv si načítaj projektovú pamäť: `C:\WORK\brigzy-clean\docs\Project-Status.md` a `docs\00-INDEX.md`, plus `C:\Claude-memory\brigzy.md`. Sme vo fáze WAITING (právnik + účtovník) — nezačínaj kódiť. Keď potvrdia, plánujeme ako appka funguje/vyzerá a staviame. Zhrň kde sme a opýtaj sa čo ďalej."*

**Obsidian vault location (personal):** `C:\Claude-memory\` (note: `brigzy.md`).
**Detailed project vault:** `C:\WORK\brigzy-clean\docs\` (this folder).

## What we're building
**Brigzy.sk** — an on-demand short-term-work ("brigády") marketplace for Slovakia (a
**Renewo** project, IČO **57476080**, lead **David Krescanko**; Renewo is **not a VAT
payer** yet). Workers find nearby jobs, agree in chat, and money is protected by
**Stripe-based escrow**; trust via KYC, two-way reviews, XP. Full picture: [[Product-Summary]].

## ⏸️ Current state (2026-06-03): WAITING
- **Discovery:** done. **Design:** done & approved (claymorphism — Purple Clay light + Dark
  Clay dark; 10-screen mockups in [[Design-System]]).
- **Architecture:** decided — Expo + Supabase + **Stripe (Connect for escrow, Stripe for
  KYC)**; Brigzy never holds funds. ADRs 0001–0005.
- **Legal:** most items **RESEARCHED** (statute-cited) — see [[Legal-Compliance-Register]].
- **Code:** intentionally **NOT started** (owner hold).

## ⛔ Blocked on (the only thing in the way)
**Advokát + daňový poradca** (one person — the accountant is also a lawyer) — confirm the
contract-type matrix (DoVP/DoPČ/Zmluva o dielo) + templates, intermediary + power-of-attorney
model, e-sign level, GDPR package, VAT/odvody/invoicing/exports.
→ hand over the single combined doc **`docs/discovery/Brigzy-Otazky-pravnik-uctovnik.docx`**
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
