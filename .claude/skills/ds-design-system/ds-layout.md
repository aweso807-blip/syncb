# DS Layout — Spacing, Grid, Breakpoints, Z-index

> All layout decisions: container constraints, grid patterns, spacing scale, responsive rules, and z-index stacking.

---

## Container

One container utility governs all page-level horizontal rhythm:

```css
@utility container-edge {
  max-width: 1380px;
  margin-inline: auto;
  padding-inline: 1.5rem;   /* 24px on mobile */
  @media (min-width: 768px) {
    padding-inline: 2.5rem; /* 40px on desktop */
  }
}
```

Usage: `<div className="container-edge">` — apply to direct content wrappers inside sections.

---

## Breakpoints

Uses Tailwind's default scale. The main breakpoint in this system is `md`:

| Prefix | Min-width | Usage |
|---|---|---|
| (none) | 0px | Mobile-first base styles |
| `sm` | 640px | Small tweaks (text size, hidden elements) |
| `md` | 768px | Desktop layout, multi-column grids, nav changes |
| `lg` | 1024px | Additional refinements for larger viewports |

**Critical `md` transitions:**
- Navigation: `hidden md:flex` — mobile nav hidden, desktop pill appears
- Grid: `grid-cols-1 md:grid-cols-2` or `md:grid-cols-3`
- Container padding: `1.5rem` → `2.5rem`
- Section padding: scales up at `md`

---

## Section Spacing Scale

| Pattern | Value | Context |
|---|---|---|
| Hero min-height | `min-h-[100svh]` | Full-viewport hero sections |
| Hero vertical | `pb-14 pt-32` | Hero inner padding |
| Section vertical | `py-24` to `py-44` | Major page sections |
| Card min-height | `min-h-[420px]` | Project cards |
| Panel min-height | `min-h-[44vh]` | Three-column home panels |
| Inner panel | `p-12` mobile / `p-16` desktop | Panel component padding |

---

## Grid Patterns

### Three-Column Home Panels
```html
<div class="grid gap-px border border-line-soft md:grid-cols-3">
```
Note: `gap-px` with border creates the divider lines between panels.

### Two-Column Project/Blog Grid
```html
<div class="grid gap-5 md:grid-cols-2">
```

### Common Gap Values
| Class | Value | Usage |
|---|---|---|
| `gap-1` | 4px | Tight inline items |
| `gap-2` | 8px | Icon + text pairs |
| `gap-4` | 16px | List items |
| `gap-5` | 20px | Card grids |
| `gap-6` | 24px | Wider card grids |
| `gap-8` | 32px | Section content gaps |
| `gap-10` | 40px | Large section gaps |
| `gap-12` | 48px | Marquee items |
| `gap-x-6` | 24px horizontal | Inline label groups |
| `gap-x-8` | 32px horizontal | Navigation item groups |
| `gap-y-1` | 4px vertical | Micro stacks |
| `gap-y-2` | 8px vertical | Label stacks |

---

## Flex Patterns

### Navigation layout
```html
<div class="flex items-center justify-between">
```

### Center everything
```html
<div class="flex items-center justify-center">
```

### Bottom-aligned baseline
```html
<div class="flex items-baseline">
```

### Wrapping inline tags
```html
<div class="flex flex-wrap items-center gap-x-8 gap-y-2">
```

---

## Padding Scale (Common Values)

| Class | Value | Usage |
|---|---|---|
| `p-1` | 4px | Micro padding |
| `p-6` | 24px | Card inner padding |
| `p-9` | 36px | Medium cards |
| `p-12` | 48px | Large panels (mobile) |
| `p-16` | 64px | Large panels (desktop) |
| `px-3` | 12px | Compact buttons |
| `px-4` | 16px | Nav pill items, small buttons |
| `px-7` | 28px | CTA buttons |
| `py-1.5` | 6px | Nav pill item height |
| `py-2` | 8px | Small button height |
| `py-3` | 12px | Standard padding |
| `py-3.5` | 14px | CTA button height |
| `py-5` | 20px | Nav unscrolled, marquee |
| `py-8` | 32px | Section separators |
| `pb-8` | 32px | Loader bottom |
| `pt-8` | 32px | Loader top |
| `pt-32` | 128px | Hero top offset (below nav) |

---

## Margin Scale (Common Values)

| Class | Value | Usage |
|---|---|---|
| `mt-8` | 32px | Hero supporting text top |
| `mt-10` | 40px | Section content separation |
| `mt-14` | 56px | Hero bottom bar top |
| `mt-16` | 64px | Large section separation |
| `mb-3` | 12px | Tight stacks |
| `mb-4` | 16px | Label → content |
| `mb-5` | 20px | Card title → description |
| `mb-8` | 32px | Section intro → content |
| `mb-10` | 40px | Hero identity row → headline |
| `mb-12` | 48px | Section separation |
| `mb-16` | 64px | Large bottom margins |

---

## Z-Index Stack

All layers from back to front:

| z-index | Element |
|---|---|
| `auto` | Regular content |
| `40` | Scroll-to-top button |
| `50` | Navigation bar |
| `60` | Grain overlay (`body::after`) |
| `70` | Scroll progress bar |
| `80` | Cursor ring |
| `81` | Cursor dot |
| `1000` | Page loader |
| `9999` | Theme transition overlay (hex SVG) |

Rules:
- Never put interactive elements above `z-50` (nav) without good reason
- Grain overlay (`z-60`) intentionally sits above nav — it's `pointer-events-none` and `mix-blend-mode: screen`
- Cursor always sits above everything except the loader and theme overlay
- The loader (`z-1000`) blocks all interaction during page load

---

## Height Conventions

| Value | Usage |
|---|---|
| `min-h-[100svh]` | Hero sections (svh = small viewport height, avoids mobile browser chrome issues) |
| `min-h-[420px]` | Project cards minimum |
| `min-h-[44vh]` | Home panel minimum |
| `h-[3px]` | Loader trailing accent line |
| `h-16` (64px) | Loader trailing gradient |
| `h-px` | Progress track |
| `h-full` | Full-height stretches |

---

## Width Conventions

| Value | Usage |
|---|---|
| `w-full` | Full-width elements |
| `w-max` | Width matches content |
| `w-[80vw]` | Modal/overlay widths |
| `max-w-[48ch]` | Supporting text / lead paragraph (48 character max) |
| `size-1` | 4px (tiny dots) |
| `size-1.5` | 6px (status dot, small decorative) |
| `size-4` | 16px (small icons, corner ticks) |
| `size-9` | 36px (icon buttons like theme toggle) |
| `size-11` | 44px (scroll-to-top button) |
| `size-14` | 56px (clap button) |

---

## Positioning Conventions

| Component | Position | Value |
|---|---|---|
| Navigation | `fixed top-0 left-0 right-0` | Always top |
| Scroll progress | `fixed top-0 left-0 right-0` | Behind nav |
| Loader | `fixed inset-0` | Full viewport |
| Cursor | `fixed left-0 top-0` | Translated by JS |
| Scroll-to-top | `fixed bottom-6 right-6` (mobile) / `bottom-8 right-8` (desktop) | Bottom-right |
| Grain | `fixed inset: 0` | Full viewport overlay |
| Hero gradient | `absolute inset-x-0 top-0 h-[65vh]` | Top gradient sweep |
| Corner ticks | `absolute` at `left-6 top-6`, `right-6 top-6`, etc. | Loader corners |

---

## Overflow Rules

- `overflow-x: hidden` on `body` — prevents horizontal scroll
- `overflow-hidden` on headline containers — clips slide-up reveals
- `overflow-hidden` on button elements — clips fill slide animation
- `[data-lenis-prevent]` attribute on any element that needs its own scroll: `overscroll-behavior: contain`
