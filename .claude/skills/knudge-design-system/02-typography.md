# 02 · Typography

## Typeface: Manrope

The entire app uses **Manrope** (Google Fonts), loaded via `next/font/google` and applied on `<body>`.

```tsx
// app/layout.tsx
import { Manrope } from 'next/font/google';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
});

// <body className={manrope.className}>
```

Non-Next projects: load Manrope (weights 400–800) and set it as the base `font-family`. Some inline components also set `fontFamily: 'Manrope'` with `letterSpacing: '-0.02em'` on tight pills.

## Type scale (as actually used)

| Role | Classes | Notes |
|------|---------|-------|
| Display / hero | `text-[2.75rem] xl:text-[3.25rem] font-bold leading-tight` | Auth/marketing headlines |
| Card title (H2/H3) | `text-2xl font-semibold leading-none tracking-tight` | The standard card heading |
| Section heading | `text-xl font-bold text-gray-900` | Form / panel headers |
| Subheading | `text-lg font-semibold text-gray-900` | Dialog titles, sub-sections |
| Body (default) | `text-sm text-gray-600` | Most body copy & controls |
| Body (large) | `text-base text-gray-900` | Emphasised paragraphs |
| Label / helper | `text-xs text-gray-500` | Field labels, captions |
| Micro / muted | `text-xs text-gray-400` | Timestamps, hints |
| Tiny pill text | `text-[10px] font-medium` + `letterSpacing: -0.02em` | Status badges |
| Stat value | `text-2xl font-bold` / `text-3xl font-bold` | KPI numbers (often brand-colored) |

## Weights

- `font-medium` (500) — buttons, labels, badge text, selected items
- `font-semibold` (600) — card titles, subheadings
- `font-bold` (700) — section headings, stat values, table headers, hero

## Conventions

- **Default body size is `text-sm`**, not `text-base`. Controls, table cells, descriptions all sit at `text-sm`.
- **Headings use `tracking-tight`** (and `leading-none` on card titles).
- **Table headers**: `text-xs font-semibold text-gray-500 uppercase tracking-wide` (sometimes `font-bold text-black`).
- **Numbers/hex/IDs**: `font-mono` (e.g. color hex inputs).
