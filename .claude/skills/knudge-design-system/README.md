# Knudge Design System

A portable design system extracted from the **KnowledgeNudge** app (Next.js 15 · React 19 · Tailwind CSS v4 · Radix UI · lucide-react). Drop this folder into any project to reproduce the same look and feel.

> **Aesthetic in one line:** clean, soft, white-surface SaaS UI — generous rounding (`rounded-xl`/`rounded-2xl`), light gray borders (`gray-200`), subtle shadows, the **Manrope** typeface, and a single configurable magenta brand color (`#C62B6D`) that drives every accent.

## What's in here

| File | Purpose |
|------|---------|
| [`00-overview.md`](./00-overview.md) | Design principles, stack, mental model |
| [`01-color.md`](./01-color.md) | Full color palette: brand, semantic, status, neutrals |
| [`02-typography.md`](./02-typography.md) | Manrope font, type scale, weights |
| [`03-spacing-radius-shadow.md`](./03-spacing-radius-shadow.md) | Spacing rhythm, border-radius scale, shadows |
| [`04-components.md`](./04-components.md) | Buttons, inputs, cards, badges, dialogs, tables, tabs, dropdowns, tooltips |
| [`05-patterns.md`](./05-patterns.md) | Page layout, nav/header, auth pages, charts, toasts, empty/loading states |
| [`06-theming.md`](./06-theming.md) | The dynamic brand-color system (the most important convention) |
| [`07-ux-interactions.md`](./07-ux-interactions.md) | **Motion, states, feedback, density, a11y — so the *experience* transfers, not just the styling** |
| [`08-portability.md`](./08-portability.md) | **Use this in any stack** (Vite/Remix/CRA/Vue/plain CSS); swap font + brand-color source |
| [`tokens.css`](./tokens.css) | Tailwind v4 `@theme` + CSS variables — paste into `globals.css` |
| [`tokens.json`](./tokens.json) | Machine-readable design tokens |
| [`SKILL.md`](./SKILL.md) | **Claude Code skill** — install in other repos so the agent builds in this style |
| [`starter/`](./starter/) | Copy-paste primitives: `cn`, `tintColor`, `Button`, `Card`, `Input`, `Badge` |

> **Works in any project, any stack.** Only two things are framework-specific — how you load the font and where the brand color comes from. Everything else (tokens, class strings, components, interaction behavior) is portable to Vite, Remix, CRA, Vue/Svelte, or plain HTML+CSS. See [`08-portability.md`](./08-portability.md).

## Quick start in a new project

1. Install deps:
   ```bash
   pnpm add clsx tailwind-merge class-variance-authority @radix-ui/react-slot lucide-react
   pnpm add -D tailwindcss @tailwindcss/postcss
   ```
2. Load **Manrope** (Next: `next/font/google`; anything else: a `<link>` or `@fontsource/manrope` — see [`02-typography.md`](./02-typography.md) / [`08-portability.md`](./08-portability.md)).
3. Paste [`tokens.css`](./tokens.css) into your global stylesheet.
4. Copy [`starter/`](./starter/) into `components/ui/` and `lib/`, and wrap your app in `ThemeProvider` (from `starter/theme.tsx`) — no NextAuth needed.
5. Build following [`04`](./04-components.md)–[`07`](./07-ux-interactions.md). Run the "same UX" checklist in [`07-ux-interactions.md`](./07-ux-interactions.md).
6. (Recommended) Install [`SKILL.md`](./SKILL.md) as a Claude Code skill so the agent keeps everything on-style.

## How to use the skill in another repo

Copy `SKILL.md` to `.claude/skills/knudge-design-system/SKILL.md` (and the `starter/` folder alongside it). Claude Code will load it when you ask to build UI, keeping new components consistent with this system.

---
_Generated from the KnowledgeNudge codebase. Tokens and class strings below are taken verbatim from production components._
