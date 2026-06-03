---
name: knudge-design-system
description: Apply the Knudge design system (clean white-surface SaaS UI — Manrope font, rounded-xl/2xl, gray-200 borders, soft shadows, configurable magenta #C62B6D brand color via inline style). Use when building or restyling UI — buttons, cards, inputs, badges, dialogs, tables, layouts — in a Next.js/React + Tailwind project, so new components match this look and feel.
---

# Knudge Design System

A portable design language extracted from the KnowledgeNudge app. When building UI, follow these rules so everything stays on-style.

## Stack assumptions (and portability)
Reference stack: React + **Tailwind CSS v4** (CSS-based config), **Radix UI** primitives, **lucide-react** icons, **class-variance-authority** for variants, a **`cn()`** helper (clsx + tailwind-merge), and **Manrope** font.

**This works in ANY project/stack** — Next.js, Vite, Remix, CRA, even Vue/Svelte/plain HTML+CSS. Only two things change per project: (1) how Manrope is loaded (next/font vs `<link>` vs @fontsource), and (2) where the brand color comes from (session vs context vs CSS var). Everything else — tokens, class strings, component recipes, and the UX behavior below — is identical everywhere. See `08-portability.md`. The goal is the SAME look AND the same user experience regardless of framework.

## The look in one paragraph
White surfaces on a soft gray canvas (`bg-gray-50`). Generous rounding — inputs and small cards `rounded-xl`, major cards and dialogs `rounded-2xl`, pills/avatars/search `rounded-full`. Light `border border-gray-200` with subtle `shadow-sm`; heavier shadows only for floating layers. Body text is `text-sm`, headings `font-semibold`/`font-bold` with `tracking-tight`. Gray text hierarchy `gray-900 → 700 → 600 → 500 → 400`. A single magenta brand color `#C62B6D` drives every accent.

## UX behavior (reproduce these so the *experience* transfers, not just the colors)
- **Transitions:** `transition-colors` on all interactive elements; themeable hover uses `hover:opacity-90`; chevrons `transition-transform`.
- **Focus:** always a visible ring (`focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2`, themeable via `--tw-ring-color`).
- **Feedback:** toasts (slide-in top-right) for confirmations; inline `text-red-600 text-xs` errors under fields (terse: Required/Invalid); dialogs for destructive actions; dashed gray centered empty states; `animate-pulse` skeletons; `Loader animate-spin` on pending actions.
- **Density:** `text-sm` body default; breathing room via `gap-6`/`space-y-4`/`p-6`; sticky capped-width layout (`max-w-7xl mx-auto`); card-grid dashboards; brand-colored active states.
- Full detail + a "same UX" checklist: `07-ux-interactions.md`.

## Non-negotiable rules
1. **Use `cn()` on every className** that merges base + variant + caller classes.
2. **Never hardcode the brand color for themeable surfaces.** Apply it via inline `style` from a runtime value (`const brandColor = themeColor ?? '#C62B6D'`):
   - bg `style={{ backgroundColor: brandColor }}` · text `style={{ color: brandColor }}` · border `style={{ borderColor: brandColor }}`
   - ring `style={{ '--tw-ring-color': brandColor } as React.CSSProperties}` + `focus:ring-2`
   - checkbox `style={{ accentColor: brandColor }}` · hover `hover:opacity-90` (not `hover:bg-[#…]`)
   - tinted bg via `tintColor(brandColor, 0.1)`
3. **Default radius:** input-sized = `rounded-xl`, card-sized = `rounded-2xl`, pill = `rounded-full`.
4. **Default container:** card = `rounded-2xl border border-gray-200 bg-white shadow-sm`.
5. **Default body text = `text-sm text-gray-600`**, not `text-base`.

## Core tokens
- Brand `#C62B6D` (hover `#A02357`), secondary `#334998`.
- Semantic: success `#129F66`, error `#DB4C5C`, warning `#C98900`, info `#175CD3`.
- Status pills: live `#175CD3`, draft `#C98900`, concluded `#1A932E`, scheduled `#2D3D90`, closed `#BA1515`, stopped `#B5361A`.
- Neutrals: text `#111827/#6B7280/#9CA3AF`, bg `#F9FAFB`, surface `#FFFFFF`, border `#E5E7EB`.
- Spacing: grid gap `gap-6`, card pad `p-6`, input `px-4 py-3 h-12`, page `max-w-7xl mx-auto px-[40px] py-8`.
- Icons (lucide): default `h-4 w-4`, page `h-5 w-5`, color `text-gray-400` hover `text-gray-600`.

## Canonical class strings (copy these)
- **Button base:** `inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50`
  - default `bg-pink-600 text-white hover:bg-pink-700` · outline `border border-gray-200 bg-white hover:bg-gray-50 text-gray-900` · ghost `hover:bg-gray-100 text-gray-900` · secondary `bg-gray-100 text-gray-900 hover:bg-gray-200` · destructive `bg-red-500 text-white hover:bg-red-600`
  - sizes: `h-10 px-4 py-2` / `h-9 px-3` / `h-11 px-8` / `h-10 w-10`
- **Input:** `flex h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`
- **Card:** `rounded-2xl border border-gray-200 bg-white text-gray-950 shadow-sm` (header `p-6`, content `p-6 pt-0`, title `text-2xl font-semibold leading-none tracking-tight`)
- **Badge/pill:** `inline-flex items-center gap-0.5 w-fit rounded-full px-2 py-1.5 text-[10px] font-medium` + inline `{ color, backgroundColor: rgba(...,0.1), border: '0.25px solid …', letterSpacing: '-0.02em' }`
- **Dialog content:** `fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg gap-4 translate-x-[-50%] translate-y-[-50%] rounded-2xl border border-gray-200 bg-white p-6 shadow-lg` + Radix `data-[state=open]:animate-in data-[state=open]:zoom-in-95` etc.
- **Table:** container `bg-white rounded-xl border border-gray-100`, header `px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50`, rows `divide-y divide-gray-50 hover:bg-gray-50`, cell `px-4 py-2.5 text-gray-700 text-sm`.
- **Empty state:** `flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500`.
- **Alert boxes:** `bg-{green|red|blue|amber}-50 border border-{…}-200 text-{…}-700 px-4 py-3 rounded-lg text-sm`.

## Starter files
Copy `starter/utils.ts` (`cn`, `tintColor`, `hexToRgba`), `starter/button.tsx` (+`BrandButton`), `starter/card.tsx`, `starter/input.tsx`, `starter/badge.tsx`, and `starter/theme.tsx` (`ThemeProvider`/`useBrandColor` — no NextAuth) into the target project. Paste `tokens.css` into your global stylesheet. Full reference: `00-overview.md` through `08-portability.md` and `tokens.json` in this folder.

## Setup in a new repo
```bash
pnpm add clsx tailwind-merge class-variance-authority @radix-ui/react-slot lucide-react
pnpm add -D tailwindcss @tailwindcss/postcss
```
Load Manrope via `next/font/google`, apply on `<body>`. Then build with the rules above.
