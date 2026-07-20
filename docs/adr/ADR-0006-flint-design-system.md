---
title: ADR-0006 — Flint: flat, Revolut-style design system replacing claymorphism
type: adr
status: accepted
date: 2026-07-20
---

# ADR-0006 — Flint design system (claymorphism → flat)

## Context
The claymorphism visual pass (soft neumorphic double-shadows, pastel purple
background, puffy rounded surfaces — see [[ADR-0003-claymorphism-design-system]])
shipped across all 30 reachable screens in June 2026. On 2026-07-12 the owner said
the look "looks bad" and asked for a genuinely new visual direction — not a token
swap, a full redesign (layouts/hierarchy open to change per screen, per the standing
"full redesign, not reskin" feedback). Target reference: the Revolut app — high
contrast, flat surfaces, confident bold typography, minimal ornamentation, accent
color used sparingly rather than tinting everything.

## Decision
Codename the new system **Flint** (flat, crisp, purple-accented) to give it a name
distinct from "clay" in code/docs.

1. **Keep the purple brand accent `#7C3AED`** — already used on the web/logo/
   marketing. This is an execution-style change (flat/bold instead of soft/pastel),
   not a brand-color change. The accent is reserved for a short, fixed list of
   elements (primary CTA fill, active tab icon/label, selected chip, links, progress/
   timeline fill, focus rings) — everything else uses a neutral gray/black/white
   base. This restraint (≤1–2 accent elements per screen) is the single biggest
   lever separating "flat professional" from "purple app."
2. **Font: Manrope → Inter.** Unifies the visual language with the brigzy-admin
   Next.js panel, which already uses Inter with an "Apple-style clean/white/subtle
   shadows" look — the closest existing reference point for the target aesthetic.
3. **Process: mockups-first**, same method that worked for claymorphism — a single
   self-contained static HTML mockup gallery (`docs/design/flint-mockups.html`,
   phone-frame wrapper, inline CSS, no build tooling), owner sign-off, then an RN
   token module + component kit, then a batched screen migration.
4. **New kit lives alongside the old one during migration** — `src/lib/useFlint.ts`
   next to `src/lib/useClay.ts`, `src/components/ui/` next to `src/components/clay/`.
   The clay kit is deleted only once every screen has migrated (mirrors how
   `useColors.ts` survived the clay migration as a leftover for 2 files).

## Token recipe (locked before mockup work starts)
- **Surfaces**: flat fill + 1px hairline border + at most **one** soft shadow (not
  clay's stacked two). Most surfaces (list rows, inputs) get **zero** shadow — shadow
  is reserved for cards floating over background, sheets, and the tab-bar FAB.
- **Radius scale**: `sm=10, md=14, lg=20, xl=28, pill=999`.
- **Spacing scale**: 4px base — `4, 8, 12, 16, 20, 24, 32, 40`; screen horizontal
  padding standardizes to 20.
- **Type scale (Inter)**: `display 32/700`, `title 22/700`, `heading 17/600`,
  `body 15/400–500`, `caption 13/500`, `micro 11/600 uppercase tracked`.
- **Color rule**: light mode near-white background with white raised cards
  (not the pastel-purple-tinted `#ECE9F5` of Purple Clay); dark mode near-black
  background with dark-gray cards. Accent purple restricted to the list above.
- **Elevation parity**: same 3-way `Platform.select` mechanism as the clay kit
  (iOS shadow props / Android `elevation` int / web `boxShadow` string), just one
  shadow spec instead of two — this is a simplification, not a new risk.

## What does NOT change (functional constraints, not visual — see [[UX-Spec]])
One-account/two-hats role model; escrow ordering (fund → sign); the 7-step post-job
wizard's auto-derived contract-type logic (DoVP/DoPČ/ZoD); 350h counter gating; the
just-in-time KYC gate; insurance (S9) staying feature-flagged/hideable. A screen's
layout/hierarchy may be freely restructured; these behaviors/sequences may not.

## Alternatives considered
- **Reskin only (new tokens, same layouts)**: rejected — this is exactly what the
  claymorphism pass already was, and it's what the owner explicitly said under-
  delivers (see redesign-scope feedback). A real redesign questions each screen's
  layout, not just its color/shadow tokens.
- **New brand accent color** (e.g. black/white + a different sharp accent): rejected
  for now — owner chose to keep `#7C3AED` since it's already brand-recognized across
  web/logo/marketing; only the execution style changes.
- **Adopt `react-native-reanimated` for new interactions**: originally deferred here
  (see "Consequences" note below) — **superseded 2026-07-20**, see
  [[Flint-Motion-Spec]]. The owner asked explicitly for animation to be planned and
  built as part of this pass, not left for later, so reanimated is now adopted for
  the Phase 2 kit (press feedback, list entrance stagger, segmented-control thumb,
  sheet drag-to-dismiss, timeline pulse).

## Consequences
- `expo-linear-gradient` usage drops sharply (from 26 files to effectively 2 deliberate
  moments: the tab-bar center FAB and the wallet balance hero) since flat fills replace
  gradient faces/sheens everywhere else.
- `useColors.ts` (already near-dead, used only by `JobLocationMap`) and
  `react-native-reanimated` adoption are explicitly out of scope for this pass —
  tracked as small, isolated, optional follow-ups.
- Migration is batched shell-first → simple/high-traffic → complex-last (wizard, chat)
  so the new kit is proven on ~20 screens before the two functionally riskiest flows.

## Addendum (2026-07-20) — v2 mockup + motion spec
Owner reviewed the v1 mockup (`docs/design/flint-mockups.html`) and asked for the
visual craft to go further — "professional-er" than the flat v1 pass — and for
animation to be planned/built now rather than deferred. v1 was replaced (not
iterated) with a v2 mockup: same token recipe and constraints above, executed with
more craft (subtle grain texture on every screen, asymmetric "aurora" glow behind
hero moments only, `tabular-nums` display-xl treatment for money amounts, abstract
duotone image tiles instead of flat icon boxes for job cards, live CSS
micro-interactions — press scale, card hover lift, staggered list entrance, a
pulsing active-timeline ring, an actual sheet slide-up + backdrop fade you can see
by opening the file). Reused the same 9-screen set (tab bar ×2 variants, home,
job detail, chat, wizard step, booking hub, wallet, settings, sheet) since that
scope was already validated as high-leverage; only the execution quality changed.
Animation decisions are now split into their own doc, [[Flint-Motion-Spec]], since
a static HTML file can't demonstrate motion — see that doc for the reanimated
adoption call above.

(Note: no image-generation tool was available in this environment, so the
`imagegen-frontend-mobile` skill's art-direction *principles* — texture, non-generic
composition, restrained decorative assets, custom-feeling icon treatment — were
applied directly in hand-authored HTML/CSS rather than via actual generated
images.)

## Addendum 2 (2026-07-20) — v3, corrected against real Revolut screenshots
Owner then sent 2 real Revolut screenshots (home + profile menu) as the concrete
reference for "premium." Comparing v2 against them surfaced that several v2
choices were the AI's own embellishment, not actually part of the reference look,
and got removed:
- **No borders on cards, anywhere.** v2 still used hairline borders on every card;
  real Revolut cards differentiate from the background *purely by fill color*
  (`#1C1C1E` card on `#000000` bg in dark, analogous light-gray-on-white in light).
  Token recipe updated: `card`/`card2` fill tokens only, no `border`/`borderStrong`
  tokens for cards (a `divider` token remains, for hairlines *between* rows inside
  one grouped card).
- **True black/white, not "near-black."** `bg` is literally `#000000` (dark) /
  `#FFFFFF` (light), not the `#0A0A0E`/`#F7F7F9` v1/v2 used.
- **No grain texture, no "aurora" glow blobs.** Both were the AI's own additions
  in v2, not present in the reference — removed entirely.
- **New pattern: giant centered balance number floating directly on the
  background**, no colored card behind it — used for the wallet screen (display-xl
  bumped 38px→44px, but the real effect is generous whitespace + zero competing
  chrome around it, not just a bigger font).
- **New component: circular icon-button + label** (`Vybrať`/`História`/`Escrow`/
  `Viac` row on wallet), mirroring Revolut's `Add money`/`Move`/`Details`/`More`.
- **New pattern: single grouped card with hairline dividers between rows** for
  menu/list screens (already used for Settings in v2; now also drives the new
  **Profil** screen).
- **New screen: Profil** (mirrors the Revolut profile-menu screenshot 1:1
  structurally — centered avatar/name/handle, a rank/status card with an
  accent-color-block motif standing in for Revolut's card-stack image, then one
  grouped menu card) — added because Brigzy didn't have a screen matching that
  reference's structure yet; Wallet already matched the "home" reference closely
  enough with a content rewrite (no new screen needed there, just the balance/
  actions/promo/list restructure above).
- **Reference-mapping discipline**: only Wallet↔Revolut-Home and Profil↔
  Revolut-Profile were mirrored structurally, since those are Brigzy's actual
  functional equivalents. Other screens (feed, job detail, chat, wizard, booking
  hub, settings) adopted the *visual language* (borderless, high contrast, sparing
  accent) but kept their own Brigzy-appropriate structure — copying Revolut's
  layout onto screens with no Revolut equivalent (a job feed, a chat) would be
  cargo-culting, not applying the aesthetic.

Screen count went 9→10 (added Profil). Total build: `docs/design/flint-mockups.html`
now supports `?dark=1` in the URL to load straight into dark mode for review/screenshots.

## Links
[[ADR-0003-claymorphism-design-system]] · [[UX-Spec]] · [[Design-System]] ·
[[brigzy-redesign-scope-feedback]] (memory) · [[Flint-Motion-Spec]] ·
`docs/design/flint-mockups.html`
