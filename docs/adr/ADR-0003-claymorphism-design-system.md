---
title: ADR-0003 — Claymorphism as a shared RN component kit, mockups-first
type: adr
status: accepted
date: 2026-06-02
---

# ADR-0003 — Claymorphism design system

## Context
Complete visual redesign in claymorphism style required for the MVP; no Figma exists.
Owner asked Claude to produce the style. 2 devs / 24 days → design can't bottleneck.

## Decision
- **Claude (AI) authors the design system**, not the devs.
- **Mockups-first** (A-19): generate ~3-5 claymorphism screen concepts with **2-3
  palette options** → owner + David choose → then codify.
- Implement as **design tokens** (palette, dual-shadow recipe, radii, type scale,
  spacing) + a **reusable RN component kit** (Button, Card, Input, Sheet, JobCard,
  tab bar, badges, etc.) replacing the current primitives.
- **Reskin** existing wired screens by swapping primitives + tokens (A-18).

## Alternatives considered
- **Devs design while coding:** rejected — turns 2 devs into ~1.3 (R-11).
- **From-scratch rebuild of every screen:** rejected — discards working logic.
- **Buy a paid RN claymorphism kit:** budget is free-tier (A-21); custom tokens give
  brand control. Revisit only if it saves real time.

## Consequences
- Design load shifts to AI → devs parallelize (UI integration ‖ escrow backend).
- **Android dual-shadow limitation** (only single `elevation`): fake the second
  shadow with layered views/gradients; test on low-end Android early (R-12).
- Performance watch on lists/maps with heavy shadows/blur (R-12).
- A consistent token layer also advances the i18n/theming cleanup from ADR-0001.

## Links
[[Feature-Breakdown]] · [[ADR-0001-stack-reuse]] · Risks R-11, R-12
