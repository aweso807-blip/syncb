# 01 · Color

The source of truth in the app is `lib/theme/colors.ts`. Reproduced and expanded here.

## Brand

| Token | Hex | Usage |
|-------|-----|-------|
| **primary** | `#C62B6D` | Primary buttons, accents, focus rings, links, active states. **Default fallback — see theming.** |
| primary (hover) | `#A02357` | Hover state for the hardcoded brand button |
| secondary | `#334998` | Secondary brand (occasional chart series) |

> `#C62B6D` in the Tailwind v4 HSL token form is `326 78% 50%` (used as `--primary` / `--ring`). It is close to Tailwind's `pink-600`, which the shadcn-style primitives use as a static stand-in (`bg-pink-600`, `ring-pink-500`). **For tenant-themeable surfaces use the real brand color via `style`, not `pink-*`.**

## Semantic / status (performance)

| Token | Hex | Meaning |
|-------|-----|---------|
| success / topPerforming | `#129F66` | Success, top-performing, completed |
| error / needAttention | `#DB4C5C` | Error, needs attention |
| warning | `#C98900` | Warning |
| info | `#175CD3` | Informational |

## Assessment status colors (soft pills)

Each status renders as a `rounded-full` pill: label in the color, background at ~10% opacity, border at the full color (`0.25px`).

| Status | Text/Border | Background (10%) |
|--------|-------------|------------------|
| live | `#175CD3` | `rgba(23, 92, 211, 0.1)` |
| draft | `#C98900` | `rgba(201, 137, 0, 0.1)` |
| concluded | `#1A932E` | `rgba(26, 147, 46, 0.1)` |
| scheduled | `#2D3D90` | `rgba(45, 61, 144, 0.1)` |
| closed | `#BA1515` | `rgba(186, 21, 21, 0.1)` |
| stopped | `#B5361A` | `rgba(181, 54, 26, 0.1)` |

## Neutrals (text & surface)

| Token | Value | Usage |
|-------|-------|-------|
| textPrimary | `#111827` (`gray-900`) | Headings, primary text |
| textSecondary | `#6B7280` (`gray-500/600`) | Secondary/body text |
| textMuted | `#9CA3AF` (`gray-400`) | Placeholders, disabled, muted captions |
| background | `#F9FAFB` (`gray-50`) | Page canvas |
| surface | `#FFFFFF` | Cards, inputs, menus |
| border | `#E5E7EB` (`gray-200`) | Default borders & dividers |

### Text hierarchy in practice
`text-gray-900` (primary) → `text-gray-700` (strong body) → `text-gray-600` (body) → `text-gray-500` (muted) → `text-gray-400` (placeholder/disabled).

## Semantic message boxes

```
success: bg-green-50  border border-green-200  text-green-700
error:   bg-red-50    border border-red-200    text-red-700
info:    bg-blue-50   border border-blue-200   text-blue-700
warning: bg-amber-50  border border-amber-300  text-amber-700
```
All with `px-4 py-3 rounded-lg text-sm`.

## Chart palette

Brand-driven plus a fixed categorical set:

```
brand        #C62B6D     completed/green   #10b981
top perf.    #129F66     abandoned/red     #ef4444
attention    #DB4C5C     indigo            #6366f1
secondary    #334998     amber             #f59e0b
                          blue             #3b82f6
                          purple           #8b5cf6
```
Brand opacity ramp for fills: `0.12` (bg) · `0.35` (light) · `0.75` (medium) · `1` (full). Unfilled gauge track: `rgb(229, 231, 235)`.

## Tailwind v4 HSL design tokens (from `globals.css`)

```
--background        0 0% 100%
--foreground        222.2 84% 4.9%
--primary           326 78% 50%     /* #C62B6D */
--primary-foreground 210 40% 98%
--muted             210 40% 96.1%
--muted-foreground  215.4 16.3% 46.9%
--destructive       0 84.2% 60.2%
--border            214.3 31.8% 91.4%
--input             214.3 31.8% 91.4%
--ring              326 78% 50%
--radius            0.5rem
```
