---
title: Claymorphism Design System — Brigzy.sk
type: design
status: draft (awaiting palette sign-off)
updated: 2026-06-02
---

# Claymorphism Design System

## Mockups
**Interactive preview:** [`claymorphism-mockups.html`](claymorphism-mockups.html) —
open in any browser. 5 screens (Home/Map, Job Detail, Escrow+Contract, Chat+Negotiation,
Wallet) × 3 palettes, Slovak labels, EUR. Palette switcher at top.

**v2 (2026-06-02):** upgraded to real SVG icon set (no emoji), refined claymorphism
(gradient surfaces + dual shadow + button specular), Manrope typeface, dynamic-island
phone frame, inset "pressed" elements, accent glows, gradient map pins. Per owner
feedback ("make it MORE BETTER").

**v3 (2026-06-02):** premium pass — softer/more refined shadows + hairline rim-light
borders (expensive "soft-UI" not toy), tracked uppercase section labels, tighter type
& spacing, faint grain overlay, verified badges, green credit amounts. Expanded to
**10 screens**: Onboarding, Home/Map, Job Detail, Chat+Negotiation, Escrow+Contract,
KYC, Post-a-Job (SOS toggle), Profile+XP/Badges, Blind Review, Wallet. Per owner
feedback ("a tiny bit more premium/professional + more screens").

> Delivered as HTML, not raster images: this environment has no image generator, and
> HTML is better here — pixel-accurate and the CSS tokens map 1:1 to the RN component kit.

## Palette — DECIDED ✅ (2026-06-02)
- **Purple Clay = LIGHT theme** (chosen) — brand #7C3AED on soft lavender clay. Premium, brand continuity.
- **Dark Clay = DARK theme** (chosen) — same purple accent on desaturated dark clay. App ships **both** (light + dark).
- ~~Soft Pastel~~ — dropped.

> The RN theme provides two token sets (light = Purple Clay, dark = Dark Clay) sharing the
> same component kit + accent. This matches the existing app's light/dark support.

## Token recipe (claymorphism)
- **Surfaces:** soft, low-contrast; large radii (cards 26px, pills 14px, buttons 20px).
- **Dual soft shadow:** `7px 7px 16px var(--shadow-dark)` + `-6px -6px 13px var(--shadow-light)`
  + subtle inset highlight. (Android: fake the light shadow with layered views — R-12.)
- **Accent** does the work; surfaces stay quiet. Money/trust app → readable, not childish.
- Each palette = a set of CSS vars (`--bg --surface --text --muted --accent --sd --sl …`).
  These become the RN theme tokens.

## Next step
Owner (Kubo) picks a palette → Claude codifies tokens + builds the RN component kit
(Button, Card, Input, Sheet, JobCard, tab bar, pill, chip, avatar) → devs reskin wired
screens. See [[ADR-0003-claymorphism-design-system]].
