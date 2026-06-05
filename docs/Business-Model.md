---
title: Business Model — Brigzy.sk
type: spec
status: draft
updated: 2026-06-03
source: "Escrow+Inzercia.docx + Brigzy research Report.docx (2026-06-03)"
---

# Business Model — two modes, one platform

From `Escrow+Inzercia.docx`. Short-term and long-term work have different needs → different
models. **MVP = mode 1 only.**

## Mode 1 — Short-term brigády → Escrow + service fee  (CORE / MVP)
- The product's whole value prop: poster pays upfront → **Stripe holds** → worker works →
  on confirmation funds release. Safety for both sides is built in (this is why people use
  Brigzy instead of Facebook groups).
- **Revenue:** service fee from the poster — **2 € + ~8–12 %** of job value (working figure
  10%). Recurring income per transaction. *(VAT 23%, C-8.)*
- Trust = escrow + KYC (verified identity) + two-way ratings/XP.

## Mode 2 — Long-term jobs → Advertising + "Brigzy Verified" layer  (LATER PHASE)
- Pure listings are a commodity (Profesia does it cheaper/better). Brigzy's edge =
  **verified, rated, XP-scored workers**, not ad space.
- No escrow here; safety via **reputation system** + **optional** downloadable contract
  templates (DoVP/DoPČ/dielo) + ToS disclaimer (parties handle their own contract; Brigzy
  not liable for the employment relationship).
- **Revenue:** basic listing **9–15 €/30 days**; featured **25–35 €**; company packages
  **30–99 €/month** (e.g. 5 listings/month).
- ⚠️ Value of this mode **depends on already having a base of verified workers** → build it
  only **after** Mode 1 has a community. On day one it would just be "an empty Profesia".

## Other revenue (per spec v2.5, later)
- **Worker Premium** **€4.99/mo OR 500 Brigy** (ad-free · 15-min head start · profile highlight).
- **In-app ads** (V2).
- **SOS surcharge** on urgent jobs.
- **Long-term mode fees:** listing €9–35; B2B subscription €30–99/mo.

## Brigy coins (in-app loyalty coins) — ⏸️ PARKED
Brigy are **in-app loyalty coins, not a € replacement.** **Parked by owner** (2026-06-03) —
mechanics TBD, will be explained later; don't build around them yet. Record of what v2.5
said is in [[Brigzy-Spec-v2.5]] §6. All cash fees + **23% VAT** (once Renewo registers as a
VAT payer — currently not).

## Strategic recommendation (from the doc)
**Launch with Mode 1 (escrow) only.** It's what differentiates Brigzy. Add Mode 2
(advertising) as phase 2, once a verified-worker base exists. → reflected in
[[Feature-Breakdown]] and [[Development-Roadmap]].
