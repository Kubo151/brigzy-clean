---
title: Flint Motion Spec — animation rules for the redesign
type: design
status: living
updated: 2026-07-20
---

# Flint Motion Spec

> Companion to [[ADR-0006-flint-design-system]] and `docs/design/flint-mockups.html`.
> Static mockups can't show motion, so this doc is the source of truth for how Flint
> moves. Written using Emil Kowalski's design-engineering framework (loaded as the
> `emil-design-eng` skill) — see that skill for the full underlying philosophy;
> this doc only pins the concrete decisions for Brigzy's actual screens.

**This supersedes ADR-0006 Phase 6's "defer react-native-reanimated" call.** That
call was right when redesign scope was purely visual; the owner has since asked
explicitly for animation to be planned and built as part of this pass, not deferred.
`react-native-reanimated` (already installed, babel plugin on, zero current imports)
is now **adopted** for the Phase 2 component kit — see Implementation Notes below.

## 1. Decision framework (apply before animating anything)

For every interaction, answer in order:

1. **How often will the user see it?** 100+/day (tab switches, chat send) → no
   animation or the absolute minimum. Tens/day (card press, list scroll) → light,
   fast. Occasional (sheets, modals, escrow state change) → standard. Rare
   (first booking completed, badge earned) → can add real delight.
2. **What's the purpose?** Spatial consistency, state indication, feedback, or
   preventing a jarring cut. If the only answer is "looks cool" and it's a
   frequent interaction, don't animate it.
3. **Easing** — entering/exiting → `ease-out`. Moving/morphing on screen →
   `ease-in-out`. Hover/color-only → `ease`. Never `ease-in` on anything the user
   initiates.
4. **Duration** — stay under 300ms for anything UI-triggered. Longer only for
   rare/celebratory moments (badge unlock, first-payout confirmation).

Curves (already in the mockup's token board):

```
--ease-out:    cubic-bezier(.23, 1, .32, 1)     // entrances, press feedback
--ease-in-out: cubic-bezier(.77, 0, .175, 1)    // on-screen movement
--ease-drawer: cubic-bezier(.32, .72, 0, 1)     // sheets / drawers (iOS-like)
```

## 2. Per-interaction spec

| Interaction | Frequency | Motion | Duration / spring | Why |
|---|---|---|---|---|
| Button / chip / tab-bar-item press | 100+/day | `scale(0.97)` on press | 160ms `ease-out` | Emil's standard press-feedback recipe; confirms the UI heard the tap. Carries forward from the old `ClayButton`/`ClayPill` spring+haptic pattern — keep the haptic (`expo-haptics` light impact), swap the *visual* spring for this scale. |
| Tab bar switch (active blob + icon/label color) | 100+/day | color + background-color transition only, no position/scale motion | 150ms `ease-out` | Highest-frequency interaction in the app. No entrance/exit choreography — just an instant-feeling color/tint change, per the "never animate 100+/day actions" rule. |
| Center FAB press | tens/day | `scale(0.94)` | 140ms `ease-out` | Slightly stronger squash than a normal button since it's the single most-tapped element on the tab bar. |
| Home feed / list entrance (first paint or pull-to-refresh) | occasional (once per screen visit, not per scroll) | stagger: opacity 0→1 + `translateY(8px)→0` per row | 260ms `ease-out`, 40ms stagger step, **cap at first 6 items** | Matches the mockup's `.enter`/`.enter1..6` classes. Cap the stagger so a 20-row list doesn't feel slow to finish — items beyond #6 appear without delay. |
| Chat bubble send/receive | tens/day in an active conversation | new bubble: opacity 0→1 + `translateY(6px)→0` | 200ms `ease-out` | Frequent enough to stay short; still needs *some* motion or new messages feel like they "teleport" in, which reads as broken given the rest of the app animates. |
| Segmented control (wizard, filters) | occasional | sliding thumb, `withSpring` | Apple-style `{ duration: 0.35, bounce: 0.15 }` | Matches the mockup's `.seg .thumb` slide. Spring (not timing) because a fast double-tap between options should feel continuous, not restart — see Interruptibility below. |
| Toggle switch (settings) | occasional | thumb `translateX` + track color | 200ms `ease-in-out` | Simple on/off state change, not a gesture — timing-based is fine, no spring needed. |
| Booking timeline "active" step (pulsing ring) | ambient/passive (not user-triggered) | `box-shadow` ring opacity pulse, infinite loop | 1.8s `ease-in-out`, looping | Ambient "this is currently happening" indicator, not feedback to an action — slow and subtle on purpose so it reads as calm status, not urgency. **Must respect reduced-motion** (see §4) since it's the one looping/infinite animation in the app. |
| Booking status change (escrow_pending → escrow_funded → signed → …) | rare per booking, but visually important | crossfade the status pill + timeline dot fill, with a `blur(2px)` mask during the transition | 240ms `ease-in-out` | Per Emil's blur-mask technique — two distinct visual states (old status color, new status color) crossfading raw looks like two objects swapping; a brief blur bridges them into one perceived transformation. This is a trust-critical moment (money state changed), worth the extra polish. |
| Bottom sheet enter (escrow confirm, filters, any `Sheet` component) | occasional | slide `translateY(100%)→0` + backdrop fade | 380ms `ease-drawer` in, **200ms `ease-out` out** (asymmetric — see §3) | Matches the mockup's `sheetUp`/`backdropIn` keyframes. Drag-to-dismiss uses velocity threshold (~0.11), not just a distance threshold — a quick flick should dismiss even if it didn't cross 50% of the sheet height. |
| Wallet balance number after a release/withdrawal | rare (once per transaction) | optional count-up tween on the digits | 500–700ms `ease-out`, only if implemented — **not required for v1** | Nice-to-have delight for a rare, meaningful moment (money arrived). Skip in the first component-kit pass; revisit once the core kit is stable. |
| Pull-to-refresh / skeleton loading | frequent for active users | shimmer sweep on skeleton rows | 1.1s linear, looping | `linear` because it's constant motion (per the framework's easing table), not an entrance/exit. |
| Badge / XP-rank unlock (rare celebratory moment) | rare/first-time | scale+opacity entrance with a touch of bounce | 400–500ms, spring `bounce: 0.25` | The one place in the app allowed a bit of personality — per the frequency table, rare/first-time moments can add delight that a 100×/day interaction never should. |

## 3. Asymmetric enter/exit

Applies wherever it's relevant (sheets, popovers, toasts): **entrance can be
slightly slower and more deliberate; exit is always faster.** The user is waiting
during entrance (fine to let them see it happen) but exit should get out of the
way immediately. The sheet row above is the concrete example (380ms in / 200ms
out) — apply the same ratio (~roughly 2:1) to any other enter/exit pair introduced
later (toasts, dropdowns, popovers).

## 4. Reduced motion

React Native: gate on `AccessibilityInfo.isReduceMotionEnabled()` /
`useReducedMotion()` (reanimated ships this hook). When enabled:

- Keep opacity and color transitions (they aid comprehension of a state change).
- Remove all `translateY`/`translateX`/`scale` motion — swap to instant or
  opacity-only.
- The one infinite-loop animation in the app (timeline active-ring pulse) must be
  fully disabled, not just slowed — infinite motion is the worst case for motion
  sensitivity.

## 5. Performance rules (carry into the component kit)

- **Only animate `transform` and `opacity`.** Never animate `padding`, `margin`,
  `width`/`height` directly — for size changes that must feel animated, animate a
  `scaleX`/`scaleY` transform or use reanimated's `Layout` transition API instead.
- Prefer `withSpring`/`withTiming` inside `useAnimatedStyle` (worklets, run off the
  JS thread) over driving styles from React state on every frame.
- The segmented-control thumb and sheet drag are the only two places doing
  continuous/gesture-driven motion — both should use `react-native-gesture-handler`
  + reanimated shared values, not `PanResponder` + `Animated` (legacy API can't
  match spring interruptibility cleanly).

## 6. Implementation notes for Phase 2 (component kit)

- Adopt `react-native-reanimated` for: button/chip/tab press (simple
  `withTiming` scale), list entrance stagger (`Layout`/`entering` props or a small
  custom stagger hook), segmented control thumb (`withSpring`), sheet
  enter/exit + drag-to-dismiss (`react-native-gesture-handler` + reanimated shared
  values), timeline active-ring pulse (`withRepeat` + `withTiming`, disabled under
  reduced motion), status crossfade+blur (`withTiming` on opacity/blur — RN blur
  needs `expo-blur`'s `BlurView` animated via an animated `intensity` prop, or a
  cross-fade of two pre-rendered states if animated blur intensity proves janky on
  low-end Android — verify on-device before committing to the blur approach).
- Keep `expo-haptics` on every press-feedback interaction — this is a strength of
  the current kit, not something the redesign should drop. Light impact for chips/
  tabs, medium for primary buttons and the FAB, matching the existing `ClayButton`/
  `ClayPill` convention.
- The legacy `Animated` API is not banned outright — for anything that's purely a
  one-shot, non-interruptible, non-gesture timing animation (e.g. a toast fade),
  either API works. Default to reanimated for consistency and because gesture-driven
  pieces (sheet, segmented control) need it anyway.

## Links
[[ADR-0006-flint-design-system]] · `docs/design/flint-mockups.html` · Emil Kowalski's
design-engineering philosophy (animations.dev) — loaded this session as the
`emil-design-eng` skill.
