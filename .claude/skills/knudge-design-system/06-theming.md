# 06 · Dynamic Brand Color (the core convention)

> **Never hardcode the brand color for theme-able surfaces.** This app is multi-tenant: each instance can set its own primary color. Hardcoding `#C62B6D` or `bg-pink-600` breaks per-tenant theming. Read this before building any accented component.

> **Stack-agnostic:** the source of the color differs per project (NextAuth session, React context, a store, or a CSS variable) but the *application* is always the same — inline `style`. For a no-NextAuth setup use the `ThemeProvider` in `starter/theme.tsx`; see [`08-portability.md`](./08-portability.md).

## How the color flows (in KnowledgeNudge)

1. An admin sets the color → stored in DB as `instance.config.theme.primaryColor`.
2. The NextAuth session callback reads it and exposes `session.user.instancePrimaryColor`.
3. Components read it at runtime and apply it via inline `style`.

```tsx
'use client';
import { useSession } from 'next-auth/react';
import { tintColor } from '@/lib/utils';

const { data: session } = useSession();
const brandColor = session?.user?.instancePrimaryColor ?? '#C62B6D';
const brandTint  = tintColor(brandColor, 0.15);
```

In a generic project, replace the session source with whatever holds your theme (a context, a CSS variable, a prop) — the **application pattern stays identical**.

## Why inline `style` (not Tailwind classes)

Tailwind can't compile runtime values. So themeable color is applied with `style`:

| Target | How |
|--------|-----|
| Background | `style={{ backgroundColor: brandColor }}` |
| Text | `style={{ color: brandColor }}` |
| Border | `style={{ borderColor: brandColor }}` |
| Tinted background | `style={{ backgroundColor: brandTint }}` |
| Focus ring | `style={{ '--tw-ring-color': brandColor } as React.CSSProperties}` + `focus:ring-2` |
| Checkbox/radio | `style={{ accentColor: brandColor }}` |
| Hover | use `hover:opacity-90` (not `hover:bg-[#…]`) |
| Input focus ring (non-brand) | `focus:ring-gray-400` |

## The `tintColor` helper

Blends a hex with white at a given opacity (0–1) — used for soft tinted backgrounds, selected rows, hover fills.

```ts
export function tintColor(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const tr = Math.round(r * opacity + 255 * (1 - opacity));
  const tg = Math.round(g * opacity + 255 * (1 - opacity));
  const tb = Math.round(b * opacity + 255 * (1 - opacity));
  return `#${tr.toString(16).padStart(2,'0')}${tg.toString(16).padStart(2,'0')}${tb.toString(16).padStart(2,'0')}`.toUpperCase();
}
```
Common tints: `tintColor(brand, 0.05)` very light bg · `0.10` selected row · `0.15` accent surface.

For charts, an `hexToRgba(hex, alpha)` equivalent is used for the opacity ramp (0.12 / 0.35 / 0.75 / 1).

## Static stand-in

The shadcn-style primitives (`button.tsx`) use `bg-pink-600` / `ring-pink-500` as a **static approximation** of the brand for non-themeable internal UI. For user-facing CTAs and tenant surfaces, prefer the real `brandColor` via `style`.

## Default

`#C62B6D` — the fallback everywhere the runtime color is absent.

## Optional: CSS-variable approach for generic projects

If you don't have a session, set a CSS var once and reference it:
```css
:root { --brand: #C62B6D; }
```
```tsx
<button style={{ backgroundColor: 'var(--brand)' }} className="hover:opacity-90 …">
```
Swap `--brand` per tenant/theme and everything re-colors.
