# DS Colors — Complete Color System

> All color decisions, exact values, usage rules, and semantic meaning for both themes.

---

## Token Reference

| Token | Dark Value | Light Value | Semantic Role |
|---|---|---|---|
| `--color-bg` | `#0a0a0a` | `#faf6e9` | Page background |
| `--color-bg-elev` | `#0f0f0f` | `#f1ede2` | Elevated surfaces (cards, nav pill, modals) |
| `--color-ink` | `#f5f5f4` | `#0a0a0a` | Primary text, high-contrast elements |
| `--color-muted` | `#a8a29e` | `#5b574e` | Secondary text, captions, descriptions |
| `--color-soft` | `#57534e` | `#a8a29e` | Tertiary text, placeholder, decorative labels |
| `--color-line` | `#1c1c1c` | `#e3dfd1` | Primary borders, dividers, strong separators |
| `--color-line-soft` | `#262626` | `#ece8d9` | Subtle borders, card outlines, hover states |
| `--color-accent` | `#3b82f6` | `#1d4ed8` | Primary interactive, links, progress, focus |
| `--color-accent-2` | `#f59e0b` | `#b45309` | Secondary highlight, warnings, tags |

---

## Tailwind Usage

Tailwind v4 maps these automatically via `@theme`. Use as color utilities:

```html
<!-- Text -->
<p class="text-ink">Primary text</p>
<p class="text-muted">Secondary text</p>
<p class="text-soft">Decorative / tertiary</p>
<span class="text-accent">Link / interactive</span>
<span class="text-accent-2">Secondary highlight</span>

<!-- Background -->
<div class="bg-bg">Page background</div>
<div class="bg-bg-elev">Card / elevated surface</div>

<!-- Border -->
<div class="border border-line">Strong border</div>
<div class="border border-line-soft">Subtle border</div>
```

---

## Opacity Modifiers (Exact Values Used)

These specific opacities appear throughout the system:

```html
bg-accent/5    <!-- 5% accent — very subtle tint -->
bg-accent/8    <!-- 8% accent -->
bg-accent/10   <!-- 10% accent — hover states -->
bg-accent/15   <!-- 15% accent — author badge background -->
bg-accent/40   <!-- 40% accent — border in active states -->
bg-accent/60   <!-- 60% accent — border in burst states -->
bg-bg/70       <!-- 70% bg — nav on scroll backdrop -->
bg-bg-elev/60  <!-- 60% bg-elev — frosted glass buttons/pill -->
text-ink/60    <!-- 60% ink — status text dimming -->
border-accent/40 <!-- 40% accent border -->
```

---

## Color Mixing Patterns

The codebase uses `color-mix(in oklab, ...)` for perceptually-uniform blending:

```css
/* Pulse dot glow */
color-mix(in oklab, currentColor 30%, transparent)
color-mix(in oklab, currentColor 0%, transparent)

/* Cursor hover background */
color-mix(in oklab, var(--color-ink) 6%, transparent)

/* Spotlight gradient */
color-mix(in oklab, var(--color-accent) 30%, transparent)
```

---

## Theme Accent Colors by Context

- **Theme toggle hex overlay (dark target):** line `#60a5fa`, dot `#93c5fd`, fill `#0a0a0a`
- **Theme toggle hex overlay (light target):** line `#2563eb`, dot `#1d4ed8`, fill `#faf6e9`
- **Status dot (available):** `#34d399` (emerald-400)
- **Project card 1 (cyan):** gradient using `cyan-500` → `cyan-400`
- **Project card 2 (amber):** gradient using `amber-500` → `amber-400`
- **Project card 3 (blue):** gradient using `blue-600` → `blue-500`

---

## Ornate Frame / Gallery Gold Palette

Used exclusively in the gallery OrnateFrame component:

| Role | Value |
|---|---|
| Bright gold | `#F5E272` |
| Mid gold | `#D4AA3C`, `#C8A030`, `#B89028` |
| Dark gold | `#7A5A12`, `#A07820`, `#6A4C0E` |
| Inner liner | `#E8C848` |
| Highlights | `#FDE870`, `#FBF4C0`, `#FFFAD0` |
| Deep shadow | `#0A0602`, `#0D0802` |
| Dark wood | `#3A2408` |
| Dark backing | `#1A1008` |
| Mat surface | `#EDE7D4` (default), `#faf6e9` (light alternate) |

Gold linear gradient (frame edges):
```css
linear-gradient(180deg, #F2D862 0%, #7A5A10 100%)
```

---

## WebGL Shader Color Palette

Used in `HeroShader.tsx` for background animations:

**Dark palette:**
```glsl
base:    vec3(0.039, 0.039, 0.039)  // #0a0a0a
color1:  vec3(0.231, 0.510, 0.965)  // electric blue
color2:  vec3(0.961, 0.620, 0.043)  // amber
color3:  vec3(0.137, 0.137, 0.169)  // ink-blue
```

**Light palette:**
```glsl
base:    vec3(0.980, 0.972, 0.953)  // #faf6e9
color1:  vec3(0.450, 0.580, 0.940)  // soft blue
color2:  vec3(0.960, 0.760, 0.430)  // warm peach
color3:  vec3(0.820, 0.770, 0.940)  // lavender
```

---

## Rules

1. **Never hardcode hex in components.** Use `var(--color-*)` or Tailwind token utilities.
2. **Accent colors differ per theme.** Dark accent (`#3b82f6`) is more electric; light accent (`#1d4ed8`) is deeper. The same `text-accent` utility handles both automatically.
3. **`bg-elev` is NOT a heavy contrast.** The difference between `bg` and `bg-elev` in dark mode is only `#0a0a0a` → `#0f0f0f`. It's intentionally subtle.
4. **Light mode is warm, not white.** `#faf6e9` is a warm beige. Do not substitute with `#ffffff` or `#f9f9f9`.
5. **Text selection** uses `background: var(--color-accent); color: var(--color-bg)` — accent bg with page bg text color.
