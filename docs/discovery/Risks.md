---
title: Risk Register — Brigzy.sk
type: discovery
status: living
updated: 2026-06-01
---

# Risk Register

Severity: 🔴 critical · 🟠 high · 🟡 medium · 🟢 low.

| ID | Risk | Sev | Mitigation | Status |
|----|------|-----|------------|--------|
| R-1 | **Contract-type misclassification** (C-1): using **DoVP for repeated activity** (should be DoPČ) → illegal employment, fine €2k–200k | 🟠 | Contract-type matrix (DoVP/DoPČ/dielo) auto-selected; in-app task classifier; advokát-approved templates; Brigzy = intermediary only ([[ADR-0005-employment-contract-model]]) | researched, mitigating |
| R-2 | ~~Money-handling licensing~~ → **resolved by design**: Stripe Connect holds funds, Brigzy never does → no NBS/EMI licence (C-2) | 🟢 | Stripe Connect locked (ADR-0002); confirm money-flow with counsel + optional NBS Inovačný hub | resolved-by-design |
| R-13 | **20% cancellation penalty void** vs consumer (C-6) — if shipped, unenforceable + SOI/sanction risk | 🟡 | Replace with reputation + provable-cost reimbursement; B2B-only contractual penalty | researched, fix planned |
| R-14 | **VAT mistiming** (C-8): late payer registration at €50k/€62.5k turnover → fine up to €20k | 🟡 | Daňový poradca; turnover monitoring; bill service fee at 23% | open |
| R-3 | **Liquidity dilution**: nationwide + all-category launch spreads supply/demand too thin → both sides churn | 🟠 | Marketing team concentrates seeding into pockets until liquid, then expands; monitor per-region fill rate | open |
| R-4 | **2-dev capacity vs. huge vision**: scope creep sinks timeline | 🟠 | Ruthless MVP = single transactional loop; everything else V2/Future; ADR-gated additions | open |
| R-5 | **Escrow complexity underestimated**: Stripe Connect + manual capture + payouts + refunds/disputes is the hardest MVP piece | 🟠 | Spike Stripe Connect early; treat as critical path; see Q-ESCROW-1 | open |
| R-6 | **Insurance dependency** (FinExpert): assuming coverage exists before a signed agreement | 🟡 | Treat as V2; no MVP feature may depend on it; C-5 | open |
| R-7 | **i18n/multi-country retrofit cost** if MVP hardcodes SK/EUR | 🟡 | Generic schema now (A-6); locale/currency as data | mitigated-by-design |
| R-8 | **GDPR** for location, Device-ID anti-fraud, KYC retention (C-9) | 🟠 | Legal review; data-minimization; processor agreements | open |
| R-9 | **26.6.2026 deadline at risk**: project paused pending lawyer+accountant, plus owner plans a full rebuild incl. real KYC → original demo date likely slips | 🟠 | Re-plan the date/scope once inputs arrive; design is done so build can move fast on resume; consider a reduced "design + non-money flows" demo if 26.6 must hold | open |
| R-10 | **Demo-mode mistaken for production**: investors/users assume real-money/legal is done | 🟡 | Clear "beta / test mode" labeling; internal note that go-live is gated by legal | open |
| R-11 | **Complete redesign + new backend in 25 days**: redesign discards reusable UI, adding large scope on top of escrow build | 🟠 | **AI produces claymorphism design system + RN component kit** (offloads design from devs, A-17); reskin not rebuild (A-18); parallelize (1 dev UI integration, 1 dev escrow); ruthless Tier-1 focus | mitigating |
| R-12 | **claymorphism perf on RN**: heavy shadows/gradients/blur can jank lists & maps | 🟡 | Pre-rendered assets, limit real-time blur, test on low-end Android early | open |
