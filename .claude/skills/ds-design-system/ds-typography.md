# DS Typography — Complete Type System

> Every font, size, weight, spacing, and prose rule used in the design system.

---

## Font Families

| Role | Font | Variable | Fallbacks |
|---|---|---|---|
| Display / Serif | Fraunces | `--font-display` / `--font-fraunces` | `"Times New Roman", serif` |
| Sans-serif (body) | Geist | `--font-sans` / `--font-geist` | `system-ui, sans-serif` |
| Monospace | Geist Mono | `--font-mono` / `--font-geist-mono` | `"JetBrains Mono", monospace` |

**Fraunces is a variable font** with two custom axes:
- `SOFT` (0–100): 0 = sharp/geometric, 100 = soft/rounded. Italic is always `SOFT: 100`.
- `opsz` (optical size): Always use `144` for large display text.
- `wght` (weight): Use `380` for display text (slightly lighter than normal for elegance).

---

## CSS Utilities

### `text-display`
```css
font-family: var(--font-display);
font-variation-settings: "opsz" 144, "wght" 380, "SOFT" 30;
letter-spacing: -0.025em;
line-height: 0.92;
```
Use for: All structural headings, upright display text.

### `text-display-it`
```css
font-family: var(--font-display);
font-variation-settings: "opsz" 144, "wght" 380, "SOFT" 100;
font-style: italic;
letter-spacing: -0.02em;
```
Use for: Emphasized italic headlines, names, brand words in accent color.

### `text-mono-tag`
```css
font-family: var(--font-mono);
font-size: 0.72rem;      /* ~11.5px */
letter-spacing: 0.16em;
text-transform: uppercase;
```
Use for: Labels, badges, technical tags, category markers.

---

## Body Configuration

```css
body {
  font-family: var(--font-sans);
  font-feature-settings: "ss01", "ss02", "cv11";
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

Feature settings explanation:
- `ss01` / `ss02`: Stylistic sets for alternate character forms in Geist
- `cv11`: Character variant 11

---

## Size Scale (Exact Values)

### Display / Hero (fluid with clamp)

| Context | Value |
|---|---|
| Hero headline | `clamp(4rem, 11.5vw, 11.5rem)` → 64px–184px |
| Loader display | `clamp(5rem, 18vw, 15rem)` → 80px–240px |
| Blog hero | `clamp(3.5rem, 12vw, 13rem)` → 56px–208px |
| Section heading | `clamp(2.25rem, 5vw, 4.5rem)` → 36px–72px |
| Card heading | `clamp(1.5rem, 2.6vw, 2.1rem)` → 24px–33.6px |
| Loader counter | `clamp(2.25rem, 9vw, 5.5rem)` → 36px–88px |

### Fixed sizes

| Context | Value | Usage |
|---|---|---|
| Blog body text | `1.0625rem` (17px) | `.blog-prose` base |
| Blog h2 | `1.75rem` (28px) | Section subheadings in prose |
| Blog h3 | `1.35rem` (21.6px) | Sub-subsections |
| Blog h4 | `1.1rem` (17.6px) | Inline headings |
| Small text | `text-sm` (14px) | Captions, nav links |
| Base text | `text-base` (16px) | Body paragraphs |
| Micro labels | `text-[10px]` | Bottom bar items, timestamps |
| Mono tags | `text-[11px]` | Status rows, loader top bar |
| Small mono | `text-[13px]` | Secondary mono labels |
| Cursor label | `text-[10px]` | Inside cursor ring |

---

## Line Heights

| Context | Value |
|---|---|
| Display headlines | `0.88` to `0.92` (tighter than line-height 1) |
| Blog headings | `1.15` |
| Blog body text | `1.8` |
| Body paragraphs | `leading-relaxed` (1.625) |
| Labels / tags | `leading-none` |

---

## Letter Spacing Scale

These exact tracking values appear throughout:

| Value | Class | Usage |
|---|---|---|
| `-0.025em` | (display utility) | Display upright headlines |
| `-0.02em` | (display-it utility) | Display italic headlines |
| `0.1em` | `tracking-[0.1em]` | Table headers |
| `0.15em` | `tracking-[0.15em]` | Bottom bar mono labels |
| `0.16em` | `tracking-[0.16em]` | `text-mono-tag` utility |
| `0.18em` | `tracking-[0.18em]` | Cursor label inside ring |
| `0.2em` | `tracking-[0.2em]` | Status row (hero/loader top) |
| `0.22em` | `tracking-[0.22em]` | Loader bottom row |
| `0.28em` | `tracking-[0.28em]` | Very spread decorative |
| `0.35em` | `tracking-[0.35em]` | Maximum spread labels |

---

## Font Weight Choices

| Class | Numeric | When to use |
|---|---|---|
| `font-medium` | 500 | Nav links, buttons, most UI text |
| `font-semibold` | 600 | `<strong>` in prose, emphasized UI |
| `font-bold` | 700 | Rare — avoid for display text |

Note: Display font always uses `wght: 380` via `font-variation-settings` — do **not** use `font-bold` with Fraunces.

---

## Blog Prose Typography (`.blog-prose`)

Apply class `.blog-prose` to the container wrapping rendered markdown/MDX content.

Rules (see `globals.css` for exact values):
- Base size: `1.0625rem`, line-height `1.8`
- Paragraph margin-bottom: `1.5em`
- Heading margins: `margin-top: 2.5em`, `margin-bottom: 0.75em`
- All headings use Fraunces with `"opsz" 144, "wght" 400, "SOFT" 40`
- Links: accent color, underline with `40%` opacity at rest, full opacity on hover
- Lists: `padding-left: 1.5em`, list markers in accent color
- Blockquote: `border-left: 2px solid accent`, italic, muted color
- `<code>`: `bg-elev`, `border-line-soft`, `border-radius: 5px`, `padding: 0.15em 0.45em`, accent text
- `<pre>`: `border-radius: 14px`, `padding: 1.25em 1.5em`
- Table headers: mono font, `0.78em`, `0.1em` tracking, uppercase, muted color
- Table cells: muted color, `0.6em 1em` padding

---

## Text Color Semantic Rules

| Use case | Class |
|---|---|
| Body text, primary content | `text-ink` |
| Subtext, descriptions, captions | `text-muted` |
| Decorative labels, placeholders | `text-soft` |
| Links, interactive, CTAs | `text-accent` |
| Warnings, secondary highlight | `text-accent-2` |
| Nav links at rest | `text-muted` |
| Nav links on hover | `text-ink` |

---

## Transformation Rules

- **Mono labels and tags:** Always `uppercase` + tracking `0.15em`+
- **Display text:** Never `uppercase` — always natural case
- **Body text:** Natural case, no transformation
- **Buttons:** Natural case (not uppercase)
