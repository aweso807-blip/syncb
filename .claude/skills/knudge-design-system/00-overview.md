# 00 · Overview & Principles

## The stack this system assumes

- **Next.js 15** (App Router) + **React 19**
- **Tailwind CSS v4** — config lives in CSS (`@import 'tailwindcss'` + `@theme`), not `tailwind.config.js`
- **Radix UI** primitives (`dialog`, `dropdown-menu`, `select`, `tabs`, `checkbox`, `tooltip`, `slot`)
- **lucide-react** for icons
- **class-variance-authority (cva)** for component variants
- **clsx + tailwind-merge** via a `cn()` helper

You can adapt this to plain React/Vite — only the font loading and Tailwind v4 CSS config change.

## Design principles

1. **White surfaces on a soft gray canvas.** Page background is `bg-gray-50` / `#f9f9f9`; content sits on `bg-white` cards.
2. **Soft, generous rounding.** Inputs and small cards use `rounded-xl`; major cards and dialogs use `rounded-2xl`; pills, avatars, and search boxes use `rounded-full`. Sharp corners are essentially never used.
3. **Light borders over heavy shadows.** Almost every container is `border border-gray-200` with at most `shadow-sm`. Shadows escalate only for floating layers (`shadow-lg`/`shadow-xl` for dropdowns, dialogs, toasts).
4. **One brand color, everywhere, configurable.** The magenta `#C62B6D` is the single accent. It is **never hardcoded for theme-able surfaces** — it comes from runtime config and is applied via inline `style`. See [`06-theming.md`](./06-theming.md). This is the most important rule in the whole system.
5. **Gray text hierarchy.** Text steps down through `gray-900 → 700 → 600 → 500 → 400`. Body text is `text-sm`; headings are `font-semibold`/`font-bold`.
6. **Semantic color is consistent.** Success = green `#129F66`, error/attention = red `#DB4C5C`, info = blue `#175CD3`, warning = amber `#C98900`.
7. **Status as soft pills.** Status tags are `rounded-full` with a 10%-opacity tinted background, a thin colored border, and a matching colored label.

## Mental model for building a screen

```
min-h-screen bg-gray-50
└── sticky header (bg-gray-50, px-8 py-6, flex justify-between)
└── main: max-w-7xl mx-auto px-[40px] py-8
    └── Card (rounded-2xl border border-gray-200 bg-white shadow-sm p-6)
        ├── CardTitle  (text-2xl font-semibold tracking-tight)
        ├── content    (text-sm text-gray-600, space-y-4)
        └── actions    (Button: primary uses brand color)
```

## The two non-negotiable conventions

- **`cn()` for every className** that merges base + variant + caller classes.
- **Brand color via `style`, not Tailwind classes** for anything that should re-theme per tenant.

Read [`06-theming.md`](./06-theming.md) before writing any accented component.
