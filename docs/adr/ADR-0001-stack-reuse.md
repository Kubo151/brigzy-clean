---
title: ADR-0001 — Keep Expo + Supabase; reuse logic, reskin UI
type: adr
status: accepted
date: 2026-06-02
---

# ADR-0001 — Keep Expo + Supabase; reuse logic, reskin UI

## Context
24 days, 2 devs, demo MVP. An existing Expo (SDK 54) + React Native + Supabase
prototype already wires auth, jobs, applications, messages, saved jobs to the DB
(see [[Codebase-Reuse-Assessment]]). A complete claymorphism redesign is required.

## Decision
Keep the existing stack — **Expo + React Native + TypeScript + Supabase** — and
**reuse the data/logic/state/navigation layers**, while **reskinning** the UI with a
new claymorphism component kit. Do **not** rewrite from scratch or switch frameworks.

## Alternatives considered
- **Rebuild from scratch (new framework, e.g. Flutter / native):** rejected —
  throws away working integration; impossible in 24 days.
- **Keep stack but rebuild every screen from zero:** rejected — wastes the wired
  logic; reskin via shared components achieves the new look far cheaper (A-18).
- **Add a separate custom backend (Node/Nest):** rejected for MVP — Supabase
  (Postgres + Auth + Realtime + Edge Functions + Storage) covers needs; a second
  backend adds ops load. Revisit at scale (Phase 3).

## Consequences
- Fast path to a working demo; preserves Supabase investment.
- Must resolve existing tech debt opportunistically: pick **one i18n system**,
  collapse duplicate legacy/new screens, confirm `users` is the profile table.
- Server-side secrets (Stripe) run in **Supabase Edge Functions** (none exist yet).
- Web (landing + future admin) hosted on **Vercel**; mobile via **Expo/EAS** (A-21).

## Links
[[ADR-0002-escrow-stripe-connect]] · [[Codebase-Reuse-Assessment]] · [[Architecture-Proposal]]
