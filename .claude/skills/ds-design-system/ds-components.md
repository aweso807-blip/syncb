# DS Components — Implementation Patterns

> Exact implementations for every UI component in the design system: markup, classes, animation props, and behavioral rules.

---

## Navigation (`Nav.tsx`)

### Structure
```tsx
<motion.nav
  initial={{ y: -40, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
  className={`fixed left-0 right-0 top-0 z-50 transition-[padding,background,border-color] duration-500 ${
    scrolled
      ? "border-b border-line-soft bg-bg/70 backdrop-blur-xl py-3"
      : "border-b border-transparent py-5"
  }`}
>
```

### Logo mark
```tsx
<a href="/" className="text-display-it text-2xl">
  name<span className="text-accent">.</span>
</a>
```
Rule: Logo always uses `text-display-it` (italic Fraunces), followed by an accent-colored period.

### Nav pill (desktop only)
```tsx
<ul className="hidden items-center gap-1 rounded-full border border-line-soft bg-bg-elev/60 p-1 text-sm font-medium backdrop-blur md:flex">
  <li>
    <a className="rounded-full px-4 py-1.5 text-muted transition hover:bg-line-soft hover:text-ink">
      Link
    </a>
  </li>
</ul>
```

### CTA button (with fill slide)
```tsx
<a className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-ink px-4 py-2 text-sm font-medium text-bg">
  <span className="relative z-10">Say hi</span>
  <svg ...arrow icon... className="relative z-10 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
  <span className="absolute inset-0 translate-y-full bg-accent transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0" />
</a>
```

### Scroll behavior
- Use `useScroll()` from `motion/react` to get `scrollY`
- Use `useMotionValueEvent(scrollY, "change", v => setScrolled(v > 30))`
- Threshold: `30px` — scrolled state activates at 30px from top

### Scrolled state changes:
- `py-3` instead of `py-5`
- `border-line-soft` instead of `border-transparent`
- `bg-bg/70 backdrop-blur-xl` background appears
- Transition: `transition-[padding,background,border-color] duration-500`

---

## Loader (`Loader.tsx`)

### When to show
Only renders on specific paths — configurable via `LOADER_PATHS` array.

### Structure
```tsx
<AnimatePresence>
  {mounted && !done && (
    <motion.div
      key="loader"
      className="fixed inset-0 z-[1000] flex flex-col bg-bg"
      exit={{ y: "-101%" }}
      transition={{ duration: 1.05, ease: [0.85, 0, 0.15, 1] }}
    >
      {/* Trailing accent line at bottom */}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-accent" />
      <span className="pointer-events-none absolute inset-x-0 bottom-[3px] h-16 bg-gradient-to-t from-accent/15 to-transparent" />
      {/* ... */}
    </motion.div>
  )}
</AnimatePresence>
```

### Counter animation
```ts
const count = useMotionValue(0);
const display = useTransform(count, v => Math.floor(v).toString().padStart(3, "0"));
const progress = useTransform(count, [0, 100], ["0%", "100%"]);
animate(count, 100, { duration: 1.9, ease: [0.65, 0, 0.35, 1] });
```

### Corner tick marks
```tsx
function Corner({ className = "", rotate = 0 }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`pointer-events-none absolute size-4 ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <span className="absolute left-0 top-0 h-px w-full bg-line" />
      <span className="absolute left-0 top-0 h-full w-px bg-line" />
    </motion.span>
  );
}
// Placed at: left-6 top-6, right-6 top-6 (rotate=90), bottom-6 right-6 (rotate=180), bottom-6 left-6 (rotate=270)
```

### Progress bar shimmer
```tsx
<div className="relative h-px w-full overflow-hidden bg-line-soft">
  <motion.div style={{ width: progress }} className="absolute inset-y-0 left-0 bg-accent" />
  <motion.div
    aria-hidden
    className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-transparent via-ink/40 to-transparent"
    animate={{ x: ["-30%", "120%"] }}
    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
  />
</div>
```

---

## Hero Section Pattern

### Status row (above headline)
```tsx
<motion.div
  initial={{ opacity: 0, y: 14 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, delay: 0.2 }}
  className="mb-10 flex flex-wrap items-center gap-x-8 gap-y-2 font-mono text-[11px] uppercase tracking-[0.2em] text-soft"
>
  <span className="inline-flex items-center gap-2 text-ink/60">
    <span
      className="size-1.5 rounded-full bg-emerald-400"
      style={{ animation: "pulse-dot 2.4s ease-out infinite", color: "#34d399" }}
    />
    Available
  </span>
  <span>Name</span>
  <span>Company</span>
  <span>Location</span>
</motion.div>
```

### Headline (slide-up reveal)
```tsx
<div className="overflow-hidden">
  <motion.h1
    initial={{ y: "106%" }}
    animate={{ y: "0%" }}
    transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
    className="text-display text-[clamp(4rem,11.5vw,11.5rem)] leading-[0.88] text-ink"
    style={{ fontVariationSettings: '"opsz" 144, "wght" 380, "SOFT" 30' }}
  >
    First word
  </motion.h1>
</div>
<div className="overflow-hidden">
  <motion.div
    initial={{ y: "106%" }}
    animate={{ y: "0%" }}
    transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.48 }}
    className="text-display text-[clamp(4rem,11.5vw,11.5rem)] leading-[0.88]"
  >
    <span
      className="text-display-it text-accent"
      style={{ fontVariationSettings: '"opsz" 144, "wght" 380, "SOFT" 100' }}
    >
      italic accent word
    </span>
    <span className="text-accent">.</span>
  </motion.div>
</div>
```

### Top gradient
```tsx
<span
  aria-hidden
  className="pointer-events-none absolute inset-x-0 top-0 h-[65vh] bg-gradient-to-b from-accent/[0.05] to-transparent"
/>
```

### Supporting text
```tsx
<motion.p
  initial={{ opacity: 0, y: 14 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.7, delay: 1.0 }}
  className="mt-8 max-w-[48ch] text-base leading-relaxed text-muted"
>
  Description text here.
</motion.p>
```

### Bottom info bar
```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.6, delay: 1.25 }}
  className="container-edge relative mt-14 flex items-center gap-8 border-t border-line-soft pt-6"
>
  <div className="flex min-w-0 flex-1 flex-wrap gap-x-6 gap-y-1 font-mono text-[10px] uppercase tracking-[0.15em] text-soft">
    <span>Tag 1</span>
    <span>Tag 2</span>
  </div>
  <a className="shrink-0 font-mono text-[10px] uppercase tracking-[0.15em] text-muted transition-colors duration-200 hover:text-ink">
    contact →
  </a>
</motion.div>
```

---

## Cursor (`Cursor.tsx`)

### Variants and sizes

| Variant | Ring size | Background | Border |
|---|---|---|---|
| `default` | 30px | transparent | 1.5px solid ink |
| `hover` | 46px | `color-mix(in oklab, ink 6%, transparent)` | 1.5px solid ink |
| `view` | 84px | `var(--color-accent)` | none |
| `dark` | 130px | `#ffffff` | none |

Ring uses `mix-blend-mode: difference` only in `dark` variant.

### Data attributes to trigger variants
```html
<a data-cursor="hover">regular link</a>
<a data-cursor="view" data-cursor-label="open">primary CTA</a>
<div data-cursor="dark">dark background section</div>
```

### Cursor label (inside ring when variant="view")
```tsx
<span className="select-none font-mono text-[10px] uppercase tracking-[0.18em]"
  style={{ color: "var(--color-bg)" }}>
  {label}
</span>
```

### Center dot: `h-1.25 w-1.25` (5px square, `rounded-full`)
Dot hides (`opacity: 0`) when variant is `view` or `dark`.

### Skip cursor on: `/admin/*` and `/gallery/*` routes.
### Skip on touch devices: `window.matchMedia("(pointer: coarse)").matches`

---

## Magnetic (`Magnetic.tsx`)

```tsx
<Magnetic strength={0.4}>
  <button>...</button>
</Magnetic>
```

Implementation:
```tsx
const x = useMotionValue(0), y = useMotionValue(0);
const sx = useSpring(x, { stiffness: 180, damping: 14, mass: 0.4 });
const sy = useSpring(y, { stiffness: 180, damping: 14, mass: 0.4 });

// on mouse move:
x.set((e.clientX - rect_center_x) * strength);
y.set((e.clientY - rect_center_y) * strength * 0.8); // Y dampened by 0.8x
// on mouse leave: x.set(0), y.set(0)
```

Default `strength`: `0.35`. Nav CTA uses `0.4`.

---

## Theme Toggle (`ThemeToggle.tsx`)

### Button
```tsx
<button
  onClick={toggle}
  aria-label="Toggle theme"
  data-cursor="hover"
  className="relative grid size-9 place-items-center overflow-hidden rounded-full border border-line-soft bg-bg-elev/60 backdrop-blur transition-colors hover:bg-line-soft"
>
  {theme === "dark" ? <SunIcon /> : <MoonIcon />}
</button>
```

### Icon sizes: `width={14} height={14}`, `strokeWidth={1.8}`, `strokeLinecap="round"`, `strokeLinejoin="round"`

### Toggle logic
```ts
const next = theme === "dark" ? "light" : "dark";
if ("startViewTransition" in document) {
  document.startViewTransition(() => {
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  });
} else {
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
}
```

---

## Scroll Progress Bar (`ScrollProgress.tsx`)

```tsx
const { scrollYProgress } = useScroll();
const scaleX = useSpring(scrollYProgress, { stiffness: 220, damping: 30, mass: 0.4 });

return (
  <motion.div
    style={{ scaleX }}
    className="fixed left-0 right-0 top-0 z-[70] h-[2px] origin-left bg-accent"
  />
);
```

Height: `2px`. Color: `bg-accent`. `origin-left` for correct scale-from-left behavior.

---

## Scroll To Top Button

```tsx
<motion.button
  initial={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: atTop ? 0 : 1, scale: atTop ? 0.9 : 1 }}
  className="fixed bottom-6 right-6 z-40 grid size-11 place-items-center rounded-full border border-line-soft bg-bg-elev/60 backdrop-blur transition-colors hover:border-line hover:text-accent md:bottom-8 md:right-8"
  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
>
  <ChevronUp size={16} />
</motion.button>
```

---

## Card Pattern (Project / Blog)

### Base card structure
```tsx
<div className="group relative overflow-hidden rounded-card border border-line-soft bg-bg-elev transition-colors hover:border-line">
  {/* Image area */}
  <div className="overflow-hidden">
    <img className="transition-transform duration-500 group-hover:scale-[1.03]" />
  </div>
  {/* Content */}
  <div className="p-6">
    <h3 className="text-display mb-2 text-[clamp(1.5rem,2.6vw,2.1rem)]">Title</h3>
    <p className="text-sm text-muted">Description</p>
  </div>
</div>
```

Key rules:
- `rounded-card` = `18px` border-radius
- Border: `border-line-soft`, hover: `border-line`
- Image hover: `scale-[1.03]`, `duration-500`
- Image always wrapped in `overflow-hidden` div

### Author/category badge
```tsx
<span className="inline-flex size-4 items-center justify-center rounded-full bg-accent/15 text-accent text-[10px] font-mono uppercase">
  A
</span>
```

---

## Marquee (`Marquee.tsx`)

```tsx
<div className="border-y border-line-soft py-5 overflow-hidden">
  <motion.div
    style={{ x: xTransform }}  // driven by scroll velocity
    className="flex gap-12 whitespace-nowrap"
  >
    {/* Items repeated */}
    {items.map((item, i) => (
      <>
        <span key={i} className="text-display-it text-[2rem] text-muted">{item}</span>
        <span className="text-accent">✦</span>
      </>
    ))}
  </motion.div>
</div>
```

- Base speed: 30px per second
- Velocity spring: `{ damping: 50, stiffness: 400 }`
- Separator: `✦` in accent color
- Item gap: `gap-12`

---

## Status Dot (Available indicator)

```tsx
<span
  className="size-1.5 rounded-full bg-emerald-400"
  style={{ animation: "pulse-dot 2.4s ease-out infinite", color: "#34d399" }}
/>
```

Color is set explicitly so `currentColor` in the `pulse-dot` keyframe gets the right value.

---

## Section Panel (Three-column home panels)

```tsx
<div className="group relative overflow-hidden border border-line-soft p-12 md:p-16 min-h-[44vh]">
  {/* Hover glow */}
  <span
    aria-hidden
    className="pointer-events-none absolute size-72 rounded-full opacity-0 bg-accent/10 blur-[80px] transition-opacity duration-700 group-hover:opacity-100"
    style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
  />
  {/* Content */}
  <div className="relative">
    ...
  </div>
</div>
```

---

## CTA Buttons — Full Variants

### Primary (solid, fill slide to accent on hover)
```tsx
<a className="group relative inline-flex overflow-hidden rounded-full bg-ink px-7 py-3.5 text-sm font-medium text-bg">
  <span className="relative z-10">Label</span>
  <span className="absolute inset-0 translate-y-full bg-accent transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0" />
</a>
```

### Secondary (outlined, fill slide to ink on hover)
```tsx
<a className="group relative inline-flex overflow-hidden rounded-full border border-ink/30 px-7 py-3.5 text-sm font-medium text-ink">
  <span className="relative z-10">Label</span>
  <span className="absolute inset-0 translate-y-full bg-ink transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0 group-hover:text-bg" />
</a>
```

### Icon button (theme toggle / scroll-to-top size)
```tsx
<button className="grid size-9 place-items-center rounded-full border border-line-soft bg-bg-elev/60 backdrop-blur transition-colors hover:bg-line-soft">
  <Icon size={14} />
</button>
```

---

## Section Heading Pattern

Standard section label + heading combination:

```tsx
<div className="mb-10">
  <span className="text-mono-tag text-accent mb-4 block">Section label</span>
  <h2 className="text-display text-[clamp(2.25rem,5vw,4.5rem)] text-ink">
    Main heading in<br />
    <span className="text-display-it text-accent">italic accent</span>
  </h2>
</div>
```

---

## Blog Navigation (`BlogNav.tsx`)

Simplified nav without the full home navigation — same visual style:
- Same pill structure: `rounded-full border border-line-soft bg-bg-elev/60`
- Links: `Back to home`, `Blog` (current page indicator)
- Same `ThemeToggle` component

---

## Footer Pattern

```tsx
<footer className="border-t border-line-soft">
  <div className="container-edge py-8 flex items-center justify-between">
    <a href="/" className="text-display-it text-2xl">
      name<span className="text-accent">.</span>
    </a>
    <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-soft">
      © {year}
    </p>
  </div>
</footer>
```
