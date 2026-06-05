---
title: Product Understanding — Brigzy.sk
type: discovery
status: draft
updated: 2026-06-01
source: "Všetky podrobnosti apky BRIGZY.SK.docx (v1.2, 2026-05-30)"
---

# Product Understanding — Brigzy.sk

> ⚠️ Draft. Based on the final-vision spec, which is **product intent, not legal
> truth** (see [[Legal-Compliance-Register]]). Refined as discovery proceeds.

## One-liner

Brigzy.sk is an **on-demand short-term labor marketplace** for Slovakia (Czech
market mentioned) that pairs the speed + geolocation of Bolt with the trust,
transactional model, and ratings of Vinted. It connects **job posters** with
**short-term workers ("brigádnici")** and holds money in **escrow** until work is
approved.

## User roles (from spec — to validate)

| Role | Who | Key needs / obligations (per spec, UNVERIFIED) |
|------|-----|-----------------------------------------------|
| **Poster — Company (B2B)** | Legal entities (s.r.o., živnostník) | Company data (IČO/DIČ/IČ DPH), bulk ad mgmt, multi-manager accounts, tax invoices for service fees |
| **Poster — Individual (C2C)** | Private person needing one-off help | Register w/o company data, pays by card |
| **Worker (Brigádnik)** | Job seeker | KYC identity verification, job search, chat, internal wallet |

## Core transactional loop (the heart of the product)

1. Poster creates a job (location, pay, category, slots, optional SOS).
2. Worker discovers it (map/list, radius filter, push) and applies.
3. Chat to align details; optional **in-chat price negotiation** (counter-offer → accept → escrow recalculated).
4. Poster confirms a worker → **Stripe escrow charges & freezes** the agreed amount.
5. Both parties **digitally sign an auto-generated contract** (type depends on legal model — PARKED, see [[Open-Questions]]).
6. On-site **QR check-in / check-out** records worked time.
7. Poster approves → escrow **Cleared** → funds move to worker **wallet**.
8. Worker withdraws to bank (SEPA, **€15 min payout**, pooling to save fees).
9. **Blind two-way reviews** revealed once both submit; worker earns **XP / rank**.

Payment states: **Pending → Cleared**, or **Disputed** (frozen until support resolves).

## Monetization (spec)

- **Service fee on posters** at successful booking (spec example: fixed €2 + 10% of job value).
- **In-app ads** for free users (native sponsored listings, bottom banners, post-action interstitials; CPM/CPC).
- **Worker Premium** subscription (~€4.99/mo): ad-free, +15 min earlier notifications, profile boosting.
- Workers free in base version.

## Trust & safety stack (spec)

Escrow · blind reviews + XP ranking + badges · KYC · auto-generated signed
contracts · cancellation policy (poster cancels <12h → 20% to worker; worker
3× no-show → permanent ban) · QR check-in/out · **3rd-party liability insurance
(FinExpert Group)** · AI-bot + human ticket support · anti-fraud referral system.

## Existing codebase (reality check)

Per `../CLAUDE.md`: Expo SDK 54 + React Native + TypeScript prototype on Supabase.
Has auth, job feed, tabs, wallet/messages/apply **screens** (largely UI/prototype).
Tables in use: `users`, `jobs`, `applications`, `saved_jobs`, `messages`.
**No escrow, payments, KYC, contracts, or insurance implemented.** This is a
UI-stage prototype, not a transactional backend.

## Known conflicts already identified

- **C-1 (CONFLICTING):** Spec escrows **gross** and releases **100%** to worker,
  while also auto-generating a **Dohoda o vykonaní práce** (an employment contract
  that legally mandates payroll deductions). These two cannot both be true. See
  [[Legal-Compliance-Register]] → C-1. **Decision parked for lawyer.**
