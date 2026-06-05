---
title: Open Questions — Brigzy.sk
type: discovery
status: living
updated: 2026-06-01
---

# Open Questions

Status: 🔴 open · 🟡 parked (waiting on external input) · 🟢 resolved.
Resolved items get folded into [[Assumptions]] or an [[adr]].

| ID | Question | Owner | Status | Notes |
|----|----------|-------|--------|-------|
| Q-LEGAL-1 | Worker payment & employment model | Owner + lawyer | 🟢 researched | DoVP=result / **DoPČ=activity** / Zmluva o dielo=C2C; matrix auto-select; Brigzy=intermediary. Pending advokát templates. C-1, [[ADR-0005-employment-contract-model]] |
| Q-KYC-1 | KYC for demo | — | 🟢 resolved | **Via Stripe** (Identity/Connect); AML borne by Stripe; rodné číslo only at DoVP. [[ADR-0004-kyc-via-stripe]] |
| Q-ESCROW-1 | Stripe escrow product | — | 🟢 resolved | **Stripe Connect, delayed/manual payouts**; Brigzy never holds funds → no NBS licence. C-2, ADR-0002 |
| Q-MARKET-1 | Launch geography | Owner | 🟢 resolved | **Nationwide SK, all categories, EUR.** Multi-language + multi-country = future. (A-1) |
| Q-RES-1 | Team / budget / timeline | Owner | 🟡 partial | Team known; **deadline 26.6.2026** (demo MVP). Budget ceiling still open. |
| Q-LAUNCH-DEF | What 26.6 milestone delivers | Owner | 🟢 resolved | **Demo MVP** (marketing + investors + feedback), not real money. (A-9/A-10) |
| Q-MAP-1 | Map provider | Architect | 🟢 resolved (MVP) | **Already free via Leaflet+OSM+Nominatim** in WebView. Keep for MVP; Google/Mapbox = future upgrade. Need to extend single-pin → all-jobs+radius. |
| Q-STACK-1 | Keep Expo + Supabase + Stripe via Edge Functions? | Architect | 🟢 resolved | Yes — reuse Expo+Supabase; Stripe (Connect + Identity) via Edge Functions. ADR-0001/0002/0004. |
| Q-WEBADMIN-1 | Web admin/stats dashboard scope + timing | Owner | 🟡 parked | Explicitly "later" (A-11). |
| Q-ACCT-1 | Accounting/tax/VAT/odvody model | Owner + accountant | 🟡 parked | Slovak sheet ready: [[Accountant-Questions-SK]] + `Brigzy-Otazky-pre-uctovnika.docx`. |
| Q-REBUILD-1 | Scope of planned full rebuild (KYC + "many other things") — what gets promoted to MVP | Owner | 🟡 parked | Re-scope after legal/accounting answers. KYC likely moves from Tier-2 stub → real. |
| Q-COLDSTART-1 | Cold-start seeding | Marketing | 🟢 resolved | Owner: nationwide, marketing-led. Engineering-agnostic. Liquidity tracked as risk R-3. |
| Q-ACCT-2 | VAT/registration specifics | Daňový poradca | 🟢 researched | Service fee + ads = **23%**; register at €50k/€62.5k turnover. Confirm OSS for cross-border B2C. C-8. |
