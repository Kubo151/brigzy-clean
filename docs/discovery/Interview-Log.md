---
title: Discovery Interview Log — Brigzy.sk
type: discovery
status: living
updated: 2026-06-01
---

# Discovery Interview Log

Running record of the grilling. Newest at bottom.

## Session 1 — 2026-06-01

**Setup.** Read full vision spec (`Všetky podrobnosti apky BRIGZY.SK.docx` v1.2).
Extracted features. Documented existing prototype in `../CLAUDE.md`.

**Governance rule established (owner directive):** Treat all docs as product intent,
not legal truth. Flag every legal/regulatory/tax/payroll/insurance/escrow claim as
VERIFIED / UNVERIFIED / CONFLICTING with risk + assumptions. Never architect around
unvalidated legal assumptions. Surface vision ↔ feasibility ↔ legal conflicts and
propose alternatives. → recorded in [[00-INDEX]] + [[Legal-Compliance-Register]].

**Q1 — Worker legal/payment model.** I flagged conflict C-1 (escrow-gross-100%-payout
vs. auto-DoVP employment obligations).
→ **Owner decision: PARKED.** Will confirm with a lawyer. Continue with other
questions; keep MVP architecture agnostic to the outcome. (See [[Open-Questions]] Q-LEGAL-1.)

**Directive:** Maintain all decisions/details in this Obsidian vault continuously.

**Q2 — Resourcing envelope (Q-RES-1).**
→ **Answer:** Brigzy is a project of **Renewo** (existing company, real team).
- **Engineering:** 2 devs — **Kubo** (owner/me-side) + **Oliver**.
- **Marketing / go-to-market:** Peter, Mišo, Samo (+ ads run by Kubo & Oliver).
- **Lead / "boss":** David.
→ **Interpretation:** Engineering capacity ≈ Envelope B (2 devs) → MVP must be the
thin transactional loop. BUT strong dedicated marketing means the **demand side of
the cold-start is well-supported** — a real advantage; we can be more confident
about seeding users. Budget + timeline not yet stated.

**Q3 — Launch focus (geography + vertical).** I recommended concentrating liquidity
(one city + one vertical) and flagged the liquidity-dilution trap.
→ **Owner answer:** Targeting **whole of Slovakia, all categories**, both poster
types. More countries + more in-app languages are explicit **future** goals. Not
one city, not one category.
→ **Architect response:** Challenged on liquidity (R-3) but reframed: nationwide +
all-category is a **marketing/ops seeding** choice (owned by the marketing team),
not an engineering constraint — the app supports it as data. Accepted. Added
architecture constraint A-6 (i18n + multi-currency/jurisdiction-ready schema from
day one) and A-7. Liquidity logged as risk R-3.

**Q4 — Timeline / deadline.**
→ **Owner answer:** Hard deadline **26 June 2026** (corrected from 27.6). It's an
**MVP for marketing, investor demo, and early user feedback** — not a real-money
public launch. Also wants a **web backend with full statistics** — but "later".
→ **Architect response:** Surfaced the CRITICAL four-way conflict (escrow mandate ×
parked legal × 25 days × 2 devs). Resolved by the milestone definition: demo MVP →
escrow **built + demoable in Stripe test mode**, real-money activation deferred behind
legal gate. Escrow NOT downgraded. Logged A-8..A-11, R-9, R-10. Web admin = separate
later workstream (Q-WEBADMIN-1).

**Envelope now locked:** 2 devs · 25 days · demo/feedback MVP · nationwide SK · EUR ·
i18n-ready · escrow test-mode · legal parked.

**Code exploration.** Assessed prototype (~13k LOC). UI shell ~70% wired to Supabase;
map already free via Leaflet+OSM+Nominatim (single-pin only); money/trust backend = 0%.
→ [[Codebase-Reuse-Assessment]]. Resolved Q-MAP-1 (keep OSM for MVP).

**Q5 — Demo Tier-2 features + big reveals.**
→ **Owner answer:** Demo shells = **KYC screens, XP/rank/badges, support chat (NON-AI)**;
escrow always in. Insurance flow NOT in demo. **AI bot → Future.** PLUS two major reveals:
1. **COMPLETE app redesign** in **claymorphism** style (possibly from Figma) — app will
   look nothing like now. → only logic/data reused, visuals discarded (A-12/A-13, R-11/R-12).
2. **Lawyer meeting tomorrow (2026-06-02)** → C-1 may resolve imminently (A-15).
→ **Architect actions:** Updated [[Feature-Breakdown]] (Tier-2, redesign workstream),
assumptions A-12..A-16, risks R-11 (redesign+backend in 25 days = 🔴) R-12 (clay perf).
Produced [[Lawyer-Questions]] sheet for tomorrow.

**Q6 — Redesign ownership/source.**
→ **Owner answer:** No Figma design; asked if Claude can "download that style and use it".
→ **Architect response:** Clarified — can't pull a copyrighted file, but CAN (a) author
the claymorphism design system in code, (b) generate reference mockups for sign-off first,
(c) build a reusable RN component kit and **reskin** the existing wired screens. AI carries
the design load → de-risks R-11 (🔴→🟠). Flagged Android dual-shadow caveat (R-12).
Logged A-17/A-18.

**Q7 — Design workflow + palette.** → **Mockups-first** (A-19); palette: present 2-3
options in mockups, owner chooses.

**Q8 — Push + budget/hosting.** → **Real push in demo** (A-20). Budget = **mostly free
tiers**; **Vercel** for web hosting, **Supabase** free (in use) (A-21).

**→ Synthesis produced** (confidence ~88%; remaining gap = legal C-1, lawyer today):
[[Product-Summary]], [[Feature-Breakdown]] (Tier-1/2, V2, Future), [[Architecture-Proposal]],
[[Data-Model]], [[API-Design]], [[Development-Roadmap]] (24-day Phase 1), ADR-0001/0002/0003.

**Q9 — Mockups + approver.** → Generate the 5 screens; approver = **Kubo** (primary),
David/team when unsure (A-22).

**Mockups delivered.** No image generator in this environment → delivered as an
**interactive HTML preview**: `docs/design/claymorphism-mockups.html` (5 screens × 3
palettes A/B/C, Slovak/EUR). CSS tokens map 1:1 to the future RN kit. See [[Design-System]].

**Mockups v2 → v3 iterations.** v2: SVG icons, gradient clay + specular, Manrope,
dynamic island. v3 (premium pass per "more premium/professional"): softer shadows +
hairline rim-light, tracked uppercase labels, grain, verified badges; expanded to
**10 screens** (added Onboarding, KYC, Post-a-Job, Profile+XP, Review). Star size
fixed per feedback.

**Q10 — Design sign-off.** → Owner: "go with this" (design direction approved).
Working assumption: lock **Purple Clay** (recommended default) unless owner names another.

**New future idea captured:** [[Feature-Ideas]] IDEA-1 — **Brigzy Coins** loyalty
currency via referral links, redeemable for Premium/ad-free. Flagged 3-way reward
overlap (coins vs Premium-weeks vs XP) for later brainstorm. Ads/Premium = V2 confirmed.

**Q10 outcome (decisions):**
- **Palette locked:** Purple Clay (light) + Dark Clay (dark mode); Soft Pastel dropped (A-23).
- **Coding ON HOLD** until lawyer responds (A-24). Stay in planning/design/docs mode.
- **Lawyer questions translated to Slovak** + delivered as Word doc (A-25):
  [[Lawyer-Questions-SK]] + `Brigzy-Otazky-pre-pravnika.docx` (validated: well-formed,
  diacritics OK, 3-part OOXML).
- Review-screen star size reduced per feedback.

_Awaiting: lawyer-meeting outcome → update [[Legal-Compliance-Register]] (C-1/C-2 → VERIFIED)
+ write payment-model ADR. THEN (on owner's go) build the RN claymorphism component kit._

## Checkpoint — 2026-06-03 — ⏸️ PROJECT PAUSED
Owner: design is set; now **waiting on lawyer AND accountant**. Plans to
**remodel/rebuild the whole app** to incorporate **identity verification (KYC)** + "many
other things"; will continue "when we have everything."
→ **Architect actions:** proactively produced a **Slovak accountant question sheet**
([[Accountant-Questions-SK]] + `Brigzy-Otazky-pre-uctovnika.docx`). Set project status to
PAUSED in [[00-INDEX]]; added Q-ACCT-1, Q-REBUILD-1; A-26/A-27; updated R-9 (26.6 date at
risk). Honestly flagged the timeline; no further build until owner returns with answers.

**RESUME TRIGGER:** owner brings lawyer + accountant answers → re-scope MVP (KYC likely
real), update legal register, write payment-model ADR, then build component kit.

## Checkpoint — 2026-06-03 — legal research + business-model docs ingested
Owner provided `Escrow+Inzercia.docx` + `Brigzy research Report.docx` and confirmed
**"everything through Stripe (escrow + KYC)"**.
→ **Absorbed & propagated to vault.** Key outcomes:
- **Stripe Connect locked** → no NBS/EMI licence (Stripe holds funds; escrow = delayed payouts). R-2 resolved-by-design. ADR-0002 updated.
- **KYC + AML via Stripe** → Brigzy not a povinná osoba; rodné číslo only at DoVP. New ADR-0004.
- **Contract matrix** DoVP/DoPČ/Zmluva o dielo (DoVP only for result work; DoPČ for activity!) + Brigzy=intermediary + AdES e-sign. New ADR-0005. R-1 reframed → contract-misclassification.
- **Remove void 20% cancellation penalty** (C-6) → reputation + provable-cost. R-13.
- **VAT 23%**, register at €50k/€62.5k (C-8). R-14.
- **GDPR**: DPIA (GPS/anti-fraud), DPA with all processors, SCC (C-9).
- **Two business modes** captured → [[Business-Model]] (escrow MVP; advertising later).
- Statuses set to **RESEARCHED** (not VERIFIED — final advokát/daňový poradca/NBS pending, A-31).
Updated: [[Legal-Compliance-Register]] (all C-x), [[Feature-Breakdown]], [[Risks]],
[[Data-Model]], [[Open-Questions]], Assumptions A-28..A-31, ADR-0002/0004/0005.

_Still PAUSED on final advisor sign-off; design done; build not started._

## Checkpoint — 2026-06-03 — third doc `Platenie odvodov Brigzy.docx` ingested
**Confirms** the model (no contradictions): Brigzy registers nobody / pays no odvody →
**firm is the exclusive employer** (RLFO, levies, tax); Brigzy may auto-generate the SP/ZP
XML one-click but liability stays with the firm; **pure Zmluva o dielo is forbidden**
(švarcsystém); matrix B2C→DoVP/DoPČ, C2C→Zmluva o dielo with one-click identical UX; start
short-term escrow only. Strengthens C-1 / ADR-0005 (still RESEARCHED, not VERIFIED).
Updated [[Legal-Compliance-Register]] + ADR-0005. No plan changes.

## Checkpoint — 2026-06-03 — refreshed advisor Word docs
Rewrote both Slovak sheets ([[Lawyer-Questions-SK]], [[Accountant-Questions-SK]]) to reflect
everything learned: framed as **confirm-our-position** questions + added new asks
(intermediary agreement + power of attorney, RLFO one-click XML helper + liability split,
AdES e-sign sufficiency, void-20%-penalty replacement, Stripe-Connect-no-licence
confirmation, 350h-per-employer counter, DPIA/DPA/SCC, contract matrix DoVP/DoPČ/dielo).
Accountant sheet reflects **Renewo = not a VAT payer** (no DPH until registration; invoicing
without DPH; escrow accounting via Stripe). Regenerated `Brigzy-Otazky-pre-pravnika.docx` +
`Brigzy-Otazky-pre-uctovnika.docx` (with Renewo header). Still WAITING; build not started.

## Checkpoint — 2026-06-03 — v2.5 master spec + Brigy clarification
Ingested `Brigzy_všetky podrobnosti.docx` = **canonical spec v2.5** → saved as
[[Brigzy-Spec-v2.5]]. It is **internally consistent with the legal research** (Stripe Connect,
DoVP/DoPČ/dielo matrix, firm=employer + RLFO XML helper, rodné číslo only at first B2C job,
no consumer cash penalty, VAT 23%). Sharpened the **e-sign** lawyer question (checkbox +
audit-log/SES vs AdES — C-12).
**Owner clarification:** **Brigy = in-app loyalty coins, NOT a € replacement → PARKED**
(explain later, don't build around them). Backed coin questions OUT of both advisor sheets;
regenerated both docx coin-free. Marked Brigy PARKED in [[Feature-Ideas]], [[Business-Model]],
[[Legal-Compliance-Register]] (C-11/C-13), [[Brigzy-Spec-v2.5]] §6. Still WAITING; build not started.

## Checkpoint — 2026-06-03 — merged advisor docs into one
Owner: the accountant is also a lawyer → **combined** the two question sheets into a single
doc: [[Lawyer-Accountant-Questions-SK]] → **`Brigzy-Otazky-pravnik-uctovnik.docx`** (Part A
právne A1–A8, Part B účtovné/daňové B1–B8, Part C demo). Removed the two superseded separate
docx. Pointers updated in [[Project-Status]] + [[Lawyer-Questions]]. Still WAITING; build not started.
