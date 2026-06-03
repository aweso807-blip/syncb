# Design System — Master Reference

> Invoke this skill to build any new app using the exact same design language as the portfolio (`D:\port`). Every value below is exact — no approximations.

---

## Quick-Start Checklist

When bootstrapping a new app with this design system:

1. Install fonts: `Fraunces`, `Geist`, `Geist_Mono` from `next/font/google`
2. Install `motion` (not framer-motion): `npm install motion`
3. Install `lenis`: `npm install lenis`
4. Copy `globals.css` theme tokens (all `@theme` and `[data-theme="light"]` vars)
5. Copy `@utility` definitions: `container-edge`, `text-display`, `text-display-it`, `text-mono-tag`
6. Copy `@keyframes`: `pulse-dot`, `shimmer`
7. Add grain overlay to `body::after`
8. Wire font CSS variables to `body`: `font-family: var(--font-sans)`
9. Wire `font-feature-settings: "ss01", "ss02", "cv11"` on `body`
10. Add `data-theme="dark"` to `<html>` as default

---

## Sub-Skills

- `/ds-setup` — Installation, config files, fonts.ts, globals.css boilerplate
- `/ds-colors` — Complete color token system, dark/light values, usage rules
- `/ds-typography` — Font families, utilities, size scales, prose styles
- `/ds-animations` — Easing curves, spring physics, motion patterns, timing
- `/ds-layout` — Container, grid, spacing, breakpoints, z-index
- `/ds-components` — Nav, Hero, Loader, Cursor, Buttons, Cards, Marquee

---

## Core Design Principles (Non-Negotiable)

1. **Dark-first** — Default theme is dark. Light is a first-class alternative, not an afterthought.
2. **Variable fonts with Fraunces** — Use `SOFT` axis for personality: upright (`SOFT: 30`) for structure, italic (`SOFT: 100`) for emphasis.
3. **One easing curve** — `cubic-bezier(0.22, 1, 0.36, 1)` is the house curve. Use it for everything that needs to feel smooth and premium.
4. **Fluid type** — All hero/display text uses `clamp()` for viewport-responsive sizing.
5. **Semantic color tokens** — Never hardcode hex values in components. Always use `var(--color-*)` or Tailwind aliases.
6. **Grain layer** — A subtle noise texture (`body::after`, `z-index: 60`, `opacity: 0.06`) is always present.
7. **Spring physics** — Interactive elements (cursor, magnetic, scroll) use spring-based motion, never linear.
8. **No scrollbar (global)** — `scrollbar-width: none` on `*`. Use `.show-scrollbar` to opt in where needed.
9. **Reduced motion** — `@media (prefers-reduced-motion: reduce)` collapses all durations to `0.01ms`.
10. **View Transitions API** — Theme switching uses `document.startViewTransition()` for smooth cross-theme animation.
