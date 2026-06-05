---
title: Product Summary — Brigzy.sk
type: summary
status: draft
updated: 2026-06-02
---

# Product Summary — Brigzy.sk

## What it is
Brigzy.sk is an **on-demand short-term labor marketplace** for Slovakia (a Renewo
project) connecting **job posters** — companies (B2B) and individuals (C2C) — with
**workers ("brigádnici")**. It combines Bolt-style geolocation/speed with Vinted-style
trust: **escrow payments**, blind two-way reviews, XP ranking, digital contracts, and
an internal wallet. Workers use it free; revenue comes from a poster service fee, ads,
and a worker Premium subscription.

## Core loop
Post a job → workers discover it on a map (radius filter) → apply → chat (with in-chat
price negotiation) → poster confirms → **Stripe escrow holds the money** → both sign an
auto-generated contract → work happens → poster approves → **escrow releases to the
worker's wallet** → worker withdraws (SEPA, €15 min) → blind two-way reviews + XP.

## The 26 June 2026 milestone (what we're actually building first)
A **demo/feedback MVP** for marketing + investors + early users — **not** a real-money
public launch. The full escrow flow is **built and demonstrated in Stripe test mode**;
real euros move only after the lawyer clears the employment/licensing model. The app
gets a **complete claymorphism redesign** (AI-produced, mockups-first), reskinning the
existing wired Expo+Supabase prototype.

## Constraints shaping everything
- **2 devs, 24 days** → ruthless scope; reuse logic, reskin UI; parallel tracks.
- **Legal model PARKED** (lawyer 2026-06-02) → architecture stays agnostic; legal-
  dependent seams (release math, contract type, licensing) are abstracted/flagged.
- **Nationwide SK, all categories** → a marketing/liquidity choice (R-3), not a code limit.
- **Multi-country/-language future** → i18n + multi-currency-ready schema from day 1.

## MVP in one line
The **functional transactional loop** (post → escrow → release → review) in test mode,
plus **demonstrable shells** (KYC, XP/badges, non-AI support chat) for the investor story.

## What is explicitly deferred
Real money/KYC/SEPA, ads, Premium, AI support bot, group jobs, QR check-in, dispute
console, referral+anti-fraud, accounting exports, web admin, **liability insurance**,
multi-country. See [[Feature-Breakdown]].

## Biggest risks
Legal misclassification (R-1) · money-licensing (R-2) · 24-day scope incl. redesign
(R-11) · liquidity dilution (R-3). Full register: [[Risks]].

## Where everything lives
This Obsidian vault (`docs/`). Start at [[00-INDEX]]. Decisions in `adr/`, legal status
in [[Legal-Compliance-Register]], tomorrow's lawyer prep in [[Lawyer-Questions]].
