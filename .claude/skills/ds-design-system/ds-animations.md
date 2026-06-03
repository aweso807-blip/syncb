# DS Animations — Motion System

> Every easing curve, spring configuration, duration, and motion pattern used in the design system. All values are exact — no approximations.

---

## House Easing Curve

**Primary ease:** `cubic-bezier(0.22, 1, 0.36, 1)`

This is the single most important easing curve in the system. It produces a fast start with a smooth, overshoot-free deceleration — the hallmark "premium" feel.

In `motion/react` array syntax: `[0.22, 1, 0.36, 1]`

Use it for:
- Navigation entrance
- Hero text slide-up
- Loader character reveals
- Theme transition
- Button fill slide
- Any element that "arrives"

**Secondary eases:**
- Loader exit: `[0.85, 0, 0.15, 1]` — symmetrical S-curve, used only for the loader curtain exit
- Loader count: `[0.65, 0, 0.35, 1]` — slower ease-in-out for the counting animation

---

## Duration Scale

| Duration | Usage |
|---|---|
| `0.18s` | Cursor dot opacity |
| `0.2s` | Link underline color, cursor label fade |
| `0.25s` | Cursor border-width, opacity transitions |
| `0.28s` | Theme hex fill phase |
| `0.3s` / `0.35s` | Quick hover effects |
| `0.34s` | Theme hex line drawing phase |
| `0.45s` | Cursor ring background |
| `0.46s` | Theme hex expand phase |
| `0.5s` | Button fill slide, hover transitions |
| `0.56s` | Theme hex dot travel phase |
| `0.6s` | Short entrance animations, status row |
| `0.65s` | View transition (theme swap) |
| `0.7s` | Body background/color transition |
| `0.8s` | Nav entrance |
| `0.9s` | Medium content reveals |
| `1.0s` | Loader character reveals |
| `1.05s` | Loader curtain exit |
| `1.1s` | Hero headline slide-up |
| `1.6s` | Shimmer sweep repeat |
| `1.9s` | Loader count (0 → 100) |
| `9s` | HexCluster slow rotation |
| `80s` | Full rotation (decorative) |

---

## Spring Physics Configurations

### Cursor Ring (lag behind pointer)
```ts
{ damping: 28, stiffness: 180, mass: 0.7 }
```

### Cursor Ring Size Change
```ts
{ type: "spring", damping: 26, stiffness: 200, mass: 0.55 }
```

### Cursor Dot (snappy, follows immediately)
```ts
{ damping: 36, stiffness: 700, mass: 0.2 }
```

### Magnetic Button
```ts
{ stiffness: 180, damping: 14, mass: 0.4 }
```

### Scroll Progress Bar
```ts
{ stiffness: 220, damping: 30, mass: 0.4 }
```

### Marquee Velocity Response
```ts
{ damping: 50, stiffness: 400 }
```

**Spring intuition:**
- Higher stiffness = snappier / quicker return
- Higher damping = less bounce
- Higher mass = heavier, slower to start and stop
- Cursor ring is deliberately laggy (low stiffness, high mass) — it trails the pointer for elegance
- Cursor dot is snappy (high stiffness, low mass) — it tracks accurately

---

## Entrance Animation Patterns

### Slide-Up Reveal (text)
```tsx
initial={{ y: "106%" }}  // or "115%"
animate={{ y: "0%" }}
transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
```
Wrap the element in `<div className="overflow-hidden">` to clip the reveal.

### Fade + Lift
```tsx
initial={{ opacity: 0, y: 14 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.6, delay: 0.2 }}
```

### Scale In
```tsx
initial={{ opacity: 0, scale: 0.6 }}
animate={{ opacity: 1, scale: 1 }}
transition={{ duration: 0.6, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
```

### Stagger (character-by-character)
```tsx
// Each character in an array:
transition={{
  duration: 1.0,
  ease: [0.22, 1, 0.36, 1],
  delay: 0.25 + i * 0.05,  // 50ms stagger
}}
```

### Navigation Entrance
```tsx
initial={{ y: -40, opacity: 0 }}
animate={{ y: 0, opacity: 1 }}
transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
```

### Viewport-Triggered (scroll animations)
```tsx
initial={{ opacity: 0, y: 24 }}
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true, amount: 0.25 }}
transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
```
`amount: 0.25` = trigger when 25% of element is visible.

---

## Loader Animation Sequence

Total animation: ~1.9s count + ~380ms delay before exit begins

```
0.00s  — Count animation starts (0 → 100, ease [0.65, 0, 0.35, 1])
0.15s  — Top row fades in (opacity 0→1, y -10→0)
0.25s  — Characters start entering (stagger 0.05s each for 6 chars)
0.35s  — Bottom counter number slides up
0.55s  — Bottom text fades in
1.9s   — Count reaches 100
2.28s  — Loader begins exit (y "-101%", duration 1.05s, ease [0.85, 0, 0.15, 1])
3.33s  — Loader fully offscreen
```

---

## Theme Toggle Hex Animation Sequence

```
Phase 1 — Dots (0.56s): 6 dots travel from screen edges to hexagon vertices
Phase 2 — Lines (0.34s): Edges and spokes draw in (pathLength 0→1)
Phase 3 — Fill (0.28s): Triangle slices fill with new theme color (opacity 0→0.82)
Phase 4 — Expand (0.46s): Hex rotates +44° and scales to cover viewport
```

Key timing constants:
```ts
const D_DOTS = 0.56, D_LINES = 0.34, D_FILL = 0.28, D_EXPAND = 0.46;
const T_LINE = D_DOTS;                       // 0.56s
const T_FILL = D_DOTS + D_LINES * 0.55;     // 0.747s
const T_EXPAND = T_FILL + D_FILL;           // 1.027s
const T_APPLY = T_EXPAND + D_EXPAND * 0.42; // 1.22s  ← theme attribute set here
const T_DONE = T_EXPAND + D_EXPAND + 0.10;  // 1.567s ← overlay removed
```

Hex geometry:
- Base radius `R0 = 110px`
- 6 vertices at 60° intervals, starting at -90° (top)
- Expand scale: `(Math.hypot(viewport_w, viewport_h) / (2 * R0)) * 1.3`
- Final rotation: `44deg`

---

## Keyframe Animations

### `pulse-dot`
```css
@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 3px color-mix(in oklab, currentColor 30%, transparent); }
  50%       { box-shadow: 0 0 0 9px color-mix(in oklab, currentColor 0%,  transparent); }
}
```
Usage: `style={{ animation: "pulse-dot 2.4s ease-out infinite", color: "#34d399" }}`
The `color` property drives the `currentColor` in the shadow.

### `shimmer`
```css
@keyframes shimmer {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```
Usage: Shimmer sweep over progress bars or loading states.
Repeat: `Infinity`, duration: `1.6s`, ease: `easeInOut`

---

## Button Fill Slide Pattern

The signature CTA hover effect — a colored fill slides up from the bottom:

```tsx
<a className="group relative inline-flex overflow-hidden rounded-full bg-ink px-7 py-3.5 text-sm font-medium text-bg">
  <span className="relative z-10">Label</span>
  {/* fill overlay */}
  <span className="absolute inset-0 translate-y-full bg-accent transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0" />
</a>
```

Rules:
- Fill starts at `translate-y-full` (fully below), moves to `translate-y-0` on hover
- Duration: `500ms`
- Easing: house curve
- The label text must be `relative z-10` to sit above the fill
- Solid fill color (not gradient)

---

## Motion Library Import

Always import from `motion/react`, not `framer-motion`:

```ts
import { motion, AnimatePresence, useMotionValue, useSpring, useScroll, useTransform, useMotionValueEvent, animate } from "motion/react";
```

---

## Reduced Motion

All animations automatically collapse to `0.01ms` via:
```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```
No additional handling needed in components — the global CSS handles it.
