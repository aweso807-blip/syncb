# 08 · Portability — use this in any project

The design system is **not tied to Next.js or NextAuth**. Only two things are framework-specific: how you load the font, and where the runtime brand color comes from. Everything else (tokens, class strings, components, UX behavior) is portable.

## What's universal vs. what you swap

| Layer | Portable? | Notes |
|-------|-----------|-------|
| Color / spacing / radius / shadow tokens | ✅ as-is | `tokens.css`, `tokens.json` |
| Tailwind class strings & component recipes | ✅ as-is | needs Tailwind v4 (or map to v3) |
| `cn`, `tintColor`, `hexToRgba` | ✅ as-is | plain TS |
| `Button` / `Card` / `Input` / `Badge` | ✅ React | port markup to Vue/Svelte if needed |
| UX/interaction behavior (`07`) | ✅ as-is | framework-independent |
| **Font loading** | 🔁 swap | per framework (below) |
| **Brand color source** | 🔁 swap | session → context/prop/CSS var (below) |

## 1. Font — load Manrope in any framework

- **Next.js:** `next/font/google` (see `02-typography.md`).
- **Vite / CRA / Remix / plain HTML:** add to `index.html`:
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  ```
  Then in CSS: `body { font-family: 'Manrope', ui-sans-serif, system-ui, sans-serif; }`
- **Self-hosted:** `@fontsource/manrope` → `import '@fontsource/manrope'`.

## 2. Brand color — framework-agnostic theming

The KnowledgeNudge app pulls the color from a NextAuth session, but the **pattern is just "read one color from somewhere at runtime and apply via inline style."** Pick whichever source fits your app. The recommended portable approach is a **CSS variable + tiny ThemeProvider**, so even non-React code can re-theme.

### Option A — CSS variable (works everywhere, even no JS framework)
```css
:root { --brand: #C62B6D; }   /* set per tenant/theme */
```
```tsx
<button style={{ backgroundColor: 'var(--brand)' }} className="hover:opacity-90 …" />
```
Swap `--brand` at runtime: `document.documentElement.style.setProperty('--brand', color)`.

### Option B — React context (typed, no Next/Auth)
See `starter/theme.tsx` (`ThemeProvider` + `useBrandColor`). Wrap your app:
```tsx
<ThemeProvider brandColor={tenant.color}>{children}</ThemeProvider>
```
```tsx
const brandColor = useBrandColor();          // falls back to #C62B6D
<button style={{ backgroundColor: brandColor }} className="hover:opacity-90" />
```

### Option C — prop drilling / your own store
Any of Redux/Zustand/Pinia/context — just produce a `brandColor` string and apply via `style`. The rules in `06-theming.md` are unchanged.

> **Whatever the source, the application is always inline `style` (bg/text/border/`--tw-ring-color`/`accentColor`), never a hardcoded Tailwind color class.** That's what makes the look identical across projects while staying themeable.

## 3. Tailwind version

- **Tailwind v4 (recommended):** paste `tokens.css` into your main stylesheet; class strings work as-is.
- **Tailwind v3:** move the `:root` tokens into `@layer base` in `globals.css` and add a `tailwind.config.js` `theme.extend` mirroring `tokens.json` (colors, borderRadius). All component class strings still apply.
- **No Tailwind at all:** use `tokens.css`/`tokens.json` as the source of truth and write the equivalent CSS (the recipes in `04`/`05` translate directly: `rounded-2xl`→`border-radius:1rem`, `border-gray-200`→`#E5E7EB`, etc.).

## 4. Non-React UI (Vue / Svelte / Angular / web components)

Port the small component recipes in `04-components.md` to your framework's template syntax — the class strings and inline-style theming rules are identical. `cn`/`tintColor`/`hexToRgba` are plain functions; copy them as-is.

## Drop-in checklist for a brand-new repo
1. `pnpm add clsx tailwind-merge class-variance-authority @radix-ui/react-slot lucide-react` (+ Radix pieces you use) and `-D tailwindcss @tailwindcss/postcss`.
2. Load Manrope (§1).
3. Paste `tokens.css` into your global stylesheet.
4. Copy `starter/` (`utils`, `button`, `card`, `input`, `badge`, `theme`) into `lib/` + `components/ui/`; fix the import alias.
5. Wrap the app in `ThemeProvider` (or set `--brand`).
6. Build following `04`–`07`. Run the §"same UX" checklist in `07-ux-interactions.md`.
