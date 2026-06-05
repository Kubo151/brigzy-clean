---
title: Working Assumptions — Brigzy.sk
type: discovery
status: living
updated: 2026-06-01
---

# Working Assumptions

Each must be confirmed. Confirmed → ✅; if invalidated → strike + note.

| ID | Assumption | Basis | Status |
|----|------------|-------|--------|
| A-1 | **Nationwide Slovakia** launch (not one city), **all categories**, both poster types. EUR. Multi-language + multi-country are explicit **future** goals. | Q3 owner answer | ✅ confirmed |
| A-6 | Data model + app must be **i18n-ready and multi-currency/jurisdiction-ready from day one** (no hardcoded EUR/SK/Slovak in core tables). MVP *data* is SK/EUR/Slovak, but structure is generic. | Architect call given A-1 future goals | 🟡 proposed |
| A-7 | "Nationwide + all categories" is treated as a **marketing/ops** seeding decision (owned by marketing team), not an engineering constraint. App supports it regardless. | Architect reframing, Q3 | 🟡 proposed |
| A-8 | **Hard deadline: 26 June 2026** (~25 days from 2026-06-01). | Q4 owner answer | ✅ confirmed |
| A-9 | The 26.6 milestone = **MVP for marketing + investor demo + early user feedback**, NOT a real-money public launch. Real payouts go live later, after legal (C-1/C-2) clears. | Q4 owner answer | ✅ confirmed |
| A-10 | Escrow is **built and demoable** for 26.6 in **Stripe test mode**; real-money activation is a later deployment toggle gated by legal. Escrow is NOT downgraded or removed. | Architect, owner-aligned | ✅ confirmed |
| A-11 | A **web backend admin / statistics dashboard** is wanted but explicitly **"later"** — a separate workstream after the 26.6 mobile MVP. | Q4 owner answer | ✅ confirmed |
| A-12 | **Complete visual redesign in claymorphism** style for the MVP (possibly from Figma). App will look nothing like current prototype. | Q5 owner answer | ✅ confirmed |
| A-13 | Redesign ⇒ only **logic/data/state/nav/types reused**; existing **visuals discarded**. Reuse ≈ "logic only", not "70% UI". | Architect, from A-12 | ✅ confirmed |
| A-14 | MVP support chat is **non-AI** (plain support chat). Real **AI bot → Future**. | Q5 owner answer | ✅ confirmed |
| A-15 | Owner meets a **lawyer on 2026-06-02 (tomorrow)** → C-1 and related legal items may resolve imminently. | Q5 owner answer | ✅ confirmed |
| A-16 | **Insurance claim flow is NOT in the demo** (→ Future; needs FinExpert partner, C-5). | Q5 owner answer | ✅ confirmed |
| A-17 | **No Figma design exists.** Claude (AI) produces the claymorphism design system: (a) reference mockups for sign-off, (b) a reusable **RN claymorphism component kit** + tokens. Devs integrate, not design. | Q6 owner answer | ✅ confirmed |
| A-18 | Redesign approach = **reskin existing wired screens** by swapping component primitives + tokens (preserve Supabase logic), not from-scratch rebuild. | Architect rec, owner-aligned | 🟡 proposed |
| A-19 | Design flow = **mockups first** (Claude generates ~3-5 claymorphism screen concepts with **2-3 palette options**) → owner+David choose → then build component kit. | Q7 owner answer | ✅ confirmed |
| A-20 | **Real push notifications ARE in the demo** (expo-notifications + token storage + send path). SOS *mass*-push logic can be simplified; basic push is real. | Q8 owner answer | ✅ confirmed |
| A-21 | **Budget = mostly free tiers.** Hosting: **Vercel** (web landing + future admin), **Supabase** (backend/DB/auth/edge fns, already in use), **Expo/EAS** (mobile), Stripe test (free), OSM maps (free). | Q8 owner answer | ✅ confirmed |
| A-22 | **Design approver = Kubo (primary)**; escalates to David / whole team only when unsure. Mockup set = 5 screens (home+map, job detail, escrow+contract, chat+negotiation, wallet) × 2-3 palettes. | Q9 owner answer | ✅ confirmed |
| A-23 | **Palette LOCKED: Purple Clay** (light theme) **+ Dark Clay** as the dark-mode variant. Purple #7C3AED accent in both. **Soft Pastel dropped.** App ships light + dark. | Q10 owner answer | ✅ confirmed |
| A-24 | **Coding is ON HOLD** until the lawyer responds on the payment/employment model (C-1/C-2). Stay in planning/design/docs mode. RN component kit NOT started yet. | Q10 owner answer | ✅ confirmed |
| A-25 | Lawyer questions to be delivered **translated to Slovak** as a **Word (.docx)** document. | Q10 owner answer | ✅ confirmed |
| A-26 | Project is **PAUSED** pending lawyer **and accountant**. Owner plans a **full remodel/rebuild** on resume, incorporating **identity verification (KYC)** + other items. "Continue when we have everything." | 2026-06-03 owner msg | ✅ confirmed |
| A-27 | The planned rebuild likely **promotes KYC from a Tier-2 stub to a real MVP feature** → re-scope MVP after legal/accounting answers. The 26.6.2026 date is at risk (R-9). | Architect inference, owner-aligned | 🟡 to reconfirm |
| A-28 | **Payment + KYC = Stripe** (locked). Stripe Connect holds funds (no NBS licence); "escrow" = delayed/manual payouts; KYC + AML via Stripe. Brigzy **never** holds money. | Owner 2026-06-03 + research report | ✅ confirmed |
| A-29 | **Contract model = matrix** DoVP (B2B result) / DoPČ (B2B activity) / Zmluva o dielo (C2C result), auto-selected; Brigzy = intermediary, never employer. The void **20% penalty is removed**. | Brigzy research Report | ✅ confirmed (templates pending advokát) |
| A-30 | **Two business modes:** short-term **escrow** (MVP) vs long-term **advertising/listings** (later phase, after verified-worker base). | Escrow+Inzercia doc | ✅ confirmed |
| A-31 | Legal items are **RESEARCHED** (statute-cited), **not yet VERIFIED** — final advokát + daňový poradca (+ optional NBS Inovačný hub) sign-off still required before go-live. | Governance + report caveats | ✅ confirmed |
| A-2 | Engineering capacity = **2 devs** (Kubo + Oliver). MVP scope sized to this. | Q2 answer | ✅ confirmed |
| A-3 | Dedicated **marketing team** (Peter, Mišo, Samo) handles demand-side cold-start; supply/demand seeding is supported. | Q2 answer | ✅ confirmed |
| A-4 | Brigzy is a **Renewo** company project (real entity behind it → can sign partner/legal agreements, hold merchant accounts). | Q2 answer | ✅ confirmed |
| A-5 | MVP = the **single transactional loop** (post → discover → apply → confirm → escrow → work → approve → release → review); heavy vision features deferred. | Architect recommendation given 2-dev capacity | 🟡 proposed, pending feature-breakdown sign-off |

## Team / org (context)

- **Renewo** — parent company. **IČO: 57476080**. **Not a VAT payer** ("nie je platiteľ
  DPH") as of 2026-06-03 → relevant to C-8 (VAT only applies after registration at the
  €50k/€62.5k threshold; until then no DPH on the service fee).
- **David Krescanko** — lead / decision-maker ("boss"), Renewo contact.
- **Kubo**, **Oliver** — developers (also run ads).
- **Peter**, **Mišo**, **Samo** — marketing.
