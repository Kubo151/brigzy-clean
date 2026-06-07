---
title: Brigzy.sk — Project Knowledge Base (MOC)
type: index
status: living
updated: 2026-06-01
---

# Brigzy.sk — Project Knowledge Base

> 👉 **New session? Start with [[Project-Status]]** — where we are + what's next.

This is the **map of content (MOC)** for the Brigzy.sk project memory. It is an
Obsidian-compatible vault. Every significant decision, assumption, risk, and open
question lives here and is updated continuously during discovery and development.

## ⚖️ Governance rule (READ FIRST)

> The product/vision documents are **product intent**, not legal, tax, payroll,
> employment-law, insurance, escrow, or regulatory truth. Every such claim is a
> **hypothesis requiring verification** and is tracked in
> [[Legal-Compliance-Register]] with a status of **VERIFIED / UNVERIFIED /
> CONFLICTING**, a risk level, and the underlying assumption.
>
> We never build architecture around an unvalidated legal assumption. Where
> *product vision*, *technical feasibility*, and *legal reality* conflict, we
> surface the conflict explicitly and propose alternatives.

## Notes

**Synthesis / deliverables**
- [[Product-Summary]] — executive summary
- [[Product-Understanding]] — what Brigzy is, roles, core loop
- [[Feature-Breakdown]] — MVP (Tier-1/Tier-2) / V2 / Future split
- [[Development-Roadmap]] — phased plan (Phase 1 = 24-day demo sprint)
- [[Business-Model]] — two modes: escrow (MVP) vs advertising/listings (later)
- [[Feature-Ideas]] — brainstorm backlog (e.g. Brigzy Coins) — not committed scope
- [[Design-System]] — claymorphism mockups + token recipe

**Architecture** (`architecture/`)
- [[Architecture-Proposal]] — per-layer recommendations (why/alt/tradeoff)
- [[Data-Model]] — initial Postgres schema
- [[API-Design]] — Data API (RLS) + Service API (Edge Functions) + escrow state machine
- [[Codebase-Reuse-Assessment]] — what the existing prototype gives us

**Decisions** (`adr/`)
- [[ADR-0001-stack-reuse]] · [[ADR-0002-escrow-stripe-connect]] · [[ADR-0003-claymorphism-design-system]]
  · [[ADR-0004-kyc-via-stripe]] · [[ADR-0005-employment-contract-model]]

**Reference** (`reference/`)
- [[Brigzy-Spec-v2.7]] — ⭐ **canonical product spec** (supersedes [[Brigzy-Spec-v2.5]])

**Discovery / living**
- [[Interview-Log]] — running Q&A from the grilling
- [[Open-Questions]] · [[Assumptions]] · [[Risks]]
- [[Legal-Compliance-Register]] — legal claims + verification status
- [[Lawyer-Questions]] — ⭐ sheet for the 2026-06-02 meeting

## Discovery status

**Phase:** ▶️ **CLEARED TO BUILD** (2026-06-07) — accountant confirmed; WAITING is over.
**Blocked on:** nothing. Only open (non-blocking): lawyer **contract templates**
(DoVP/DoPČ/ZoD wording) + selected wordings (splnomocnenie, VOP, GDPR consents) + **FinExpert**
insurance licence question. **Payment + KYC architecture locked: Stripe Connect + Stripe
Identity** (no NBS licence; Brigzy never holds funds).
**Canonical spec:** [[Brigzy-Spec-v2.7]] (supersedes v2.5) — accountant outputs + 8 legal fixes.
**Design:** ✅ approved — Purple Clay (light) + Dark Clay (dark). App code rebuild **not started yet**.
**Planned next:** owner wants a **full remodel/rebuild** incorporating real KYC, escrow, 350h
counter, contracts, Brigy, cross-sell — per v2.7.
**Code:** No implementation changes yet. Existing prototype documented in `../CLAUDE.md`.

### To resume cleanly
1. Detailed planning pass — how the app works + looks (full UX + flows, v2.7 features).
2. Update [[Legal-Compliance-Register]] (RESEARCHED → VERIFIED where accountant confirmed) +
   finalize payment-model ADR; keep lawyer template items open.
3. Build the Purple/Dark claymorphism RN component kit, then reskin/rebuild.

## Deliverables to produce at end of discovery

Product Summary · MVP Scope · Technical Architecture · Risk Assessment ·
Obsidian Notes (this vault) · Development Plan.
