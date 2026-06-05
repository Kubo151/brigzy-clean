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

**Discovery / living**
- [[Interview-Log]] — running Q&A from the grilling
- [[Open-Questions]] · [[Assumptions]] · [[Risks]]
- [[Legal-Compliance-Register]] — legal claims + verification status
- [[Lawyer-Questions]] — ⭐ sheet for the 2026-06-02 meeting

## Discovery status

**Phase:** ⏸️ **PAUSED** (2026-06-03) — awaiting external inputs before any build.
**Blocked on:** final **advokát** sign-off (contract matrix + templates, intermediary/PoA)
and **daňový poradca** (VAT/odvody). Most legal questions are now **RESEARCHED** (cited
statutes) via `Brigzy research Report.docx` — see [[Legal-Compliance-Register]] — but not
yet VERIFIED. **Payment + KYC architecture is locked: Stripe Connect + Stripe KYC** (no NBS
licence; Brigzy never holds funds).
**Design:** ✅ approved — Purple Clay (light) + Dark Clay (dark). Coding intentionally **not started** (A-24).
**Planned on resume:** owner intends a **full remodel/rebuild** incorporating identity
verification (KYC) + other items once the legal/accounting picture is complete.
**Confidence toward 95% alignment:** ~88% (gap = legal/accounting answers).
**Code:** No implementation changes. Existing prototype documented in `../CLAUDE.md`.

### To resume cleanly
1. Owner returns with lawyer + accountant answers → update [[Legal-Compliance-Register]]
   (C-x → VERIFIED) + write payment-model ADR.
2. Re-confirm scope given the planned rebuild (KYC now likely promoted toward MVP).
3. On owner's go: build the Purple/Dark claymorphism RN component kit, then reskin/rebuild.

## Deliverables to produce at end of discovery

Product Summary · MVP Scope · Technical Architecture · Risk Assessment ·
Obsidian Notes (this vault) · Development Plan.
