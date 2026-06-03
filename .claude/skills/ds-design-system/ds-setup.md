# DS Setup — Installation & Configuration

> Complete setup guide to bootstrap a new Next.js app with this exact design system.

---

## 1. Dependencies

```bash
npm install motion lenis
```

`next/font/google` is built into Next.js — no install needed.

---

## 2. `app/fonts.ts`

```ts
import { Fraunces, Geist, Geist_Mono } from "next/font/google";

export const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["SOFT", "opsz"],       // Variable axes: SOFT controls curviness (0–100), opsz = optical size
  variable: "--font-fraunces",
  display: "swap",
});

export const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

export const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});
```

---

## 3. `app/layout.tsx` — Root Layout

```tsx
import { fraunces, geist, geistMono } from "./fonts";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="dark"           // Dark is default
      className={`${fraunces.variable} ${geist.variable} ${geistMono.variable}`}
      suppressHydrationWarning    // Required: theme attribute set by client script
    >
      <head>
        {/* Prevent FOUC: inline script sets theme before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('theme');
                if (t) document.documentElement.setAttribute('data-theme', t);
              } catch {}
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

## 4. `app/globals.css` — Complete File

```css
@import "tailwindcss";

@theme {
  /* ── Color tokens (dark default) ── */
  --color-bg: #0a0a0a;
  --color-bg-elev: #0f0f0f;
  --color-ink: #f5f5f4;
  --color-muted: #a8a29e;
  --color-soft: #57534e;
  --color-line: #1c1c1c;
  --color-line-soft: #262626;
  --color-accent: #3b82f6;
  --color-accent-2: #f59e0b;

  /* ── Font stacks ── */
  --font-display: var(--font-fraunces), "Times New Roman", serif;
  --font-sans: var(--font-geist), system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), "JetBrains Mono", monospace;

  /* ── Radius ── */
  --radius-card: 18px;
}

/* Light theme — same variable names, different values */
:root[data-theme="light"] {
  --color-bg: #faf6e9;
  --color-bg-elev: #f1ede2;
  --color-ink: #0a0a0a;
  --color-muted: #5b574e;
  --color-soft: #a8a29e;
  --color-line: #e3dfd1;
  --color-line-soft: #ece8d9;
  --color-accent: #1d4ed8;
  --color-accent-2: #b45309;
}

/* ── Global resets ── */
* { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
* { scrollbar-width: none; }
*::-webkit-scrollbar { width: 0; height: 0; }

/* ── Date/time picker icon visibility ── */
input[type="datetime-local"]::-webkit-calendar-picker-indicator,
input[type="date"]::-webkit-calendar-picker-indicator,
input[type="time"]::-webkit-calendar-picker-indicator {
  filter: invert(1);
  opacity: 0.75;
  cursor: pointer;
}
:root[data-theme="light"] input[type="datetime-local"]::-webkit-calendar-picker-indicator,
:root[data-theme="light"] input[type="date"]::-webkit-calendar-picker-indicator,
:root[data-theme="light"] input[type="time"]::-webkit-calendar-picker-indicator {
  filter: none;
  opacity: 0.7;
}

/* ── Opt-in scrollbar ── */
.show-scrollbar { scrollbar-width: thin; scrollbar-color: var(--color-line) transparent; }
.show-scrollbar::-webkit-scrollbar { width: 6px; }
.show-scrollbar::-webkit-scrollbar-track { background: transparent; }
.show-scrollbar::-webkit-scrollbar-thumb { background: var(--color-line); border-radius: 999px; }

/* ── Base styles ── */
html { background: var(--color-bg); color: var(--color-ink); }
body {
  background: var(--color-bg);
  color: var(--color-ink);
  font-family: var(--font-sans);
  font-feature-settings: "ss01", "ss02", "cv11";
  overflow-x: hidden;
  transition: background-color 0.7s cubic-bezier(0.22,1,0.36,1), color 0.7s cubic-bezier(0.22,1,0.36,1);
}

/* ── View transition for theme swap ── */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.65s;
  animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
}

/* ── Text selection ── */
::selection { background: var(--color-accent); color: var(--color-bg); }

/* ── Lenis smooth scroll ── */
html.lenis, html.lenis body { height: auto; }
.lenis.lenis-smooth { scroll-behavior: auto !important; }
.lenis.lenis-smooth [data-lenis-prevent] { overscroll-behavior: contain; }
.lenis.lenis-stopped { overflow: hidden; }
.lenis.lenis-scrolling iframe { pointer-events: none; }

/* ── Grain overlay ── */
body::after {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 60;
  opacity: 0.06;
  mix-blend-mode: screen;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 240 240' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.7 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* ── Layout utility ── */
@utility container-edge {
  max-width: 1380px;
  margin-inline: auto;
  padding-inline: 1.5rem;
  @media (min-width: 768px) { padding-inline: 2.5rem; }
}

/* ── Typography utilities ── */
@utility text-display {
  font-family: var(--font-display);
  font-variation-settings: "opsz" 144, "wght" 380, "SOFT" 30;
  letter-spacing: -0.025em;
  line-height: 0.92;
}
@utility text-display-it {
  font-family: var(--font-display);
  font-variation-settings: "opsz" 144, "wght" 380, "SOFT" 100;
  font-style: italic;
  letter-spacing: -0.02em;
}
@utility text-mono-tag {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

/* ── Keyframes ── */
@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 3px color-mix(in oklab, currentColor 30%, transparent); }
  50%       { box-shadow: 0 0 0 9px color-mix(in oklab, currentColor 0%,  transparent); }
}

@keyframes shimmer {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* ── Reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}

/* ── Blog prose typography ── */
.blog-prose {
  color: var(--color-ink);
  font-size: 1.0625rem;
  line-height: 1.8;

  & p { margin-bottom: 1.5em; }
  & p:last-child { margin-bottom: 0; }

  & h1, & h2, & h3, & h4 {
    font-family: var(--font-display);
    font-variation-settings: "opsz" 144, "wght" 400, "SOFT" 40;
    letter-spacing: -0.02em;
    color: var(--color-ink);
    margin-top: 2.5em;
    margin-bottom: 0.75em;
    line-height: 1.15;
  }
  & h2 { font-size: 1.75rem; }
  & h3 { font-size: 1.35rem; }
  & h4 { font-size: 1.1rem; }

  & strong { color: var(--color-ink); font-weight: 600; }
  & em { font-style: italic; color: var(--color-muted); }

  & a {
    color: var(--color-accent);
    text-decoration: underline;
    text-underline-offset: 3px;
    text-decoration-color: color-mix(in oklab, var(--color-accent) 40%, transparent);
    transition: text-decoration-color 0.2s;
    &:hover { text-decoration-color: var(--color-accent); }
  }

  & ul, & ol {
    padding-left: 1.5em;
    margin-bottom: 1.5em;
    & li { margin-bottom: 0.4em; color: var(--color-muted); }
    & li::marker { color: var(--color-accent); }
  }
  & ul { list-style-type: disc; }
  & ol { list-style-type: decimal; }

  & blockquote {
    border-left: 2px solid var(--color-accent);
    padding-left: 1.25em;
    margin: 2em 0;
    font-style: italic;
    color: var(--color-muted);
  }

  & hr {
    border: none;
    border-top: 1px solid var(--color-line-soft);
    margin: 2.5em 0;
  }

  & code {
    font-family: var(--font-mono);
    font-size: 0.875em;
    background: var(--color-bg-elev);
    border: 1px solid var(--color-line-soft);
    border-radius: 5px;
    padding: 0.15em 0.45em;
    color: var(--color-accent);
  }

  & pre {
    background: var(--color-bg-elev);
    border: 1px solid var(--color-line-soft);
    border-radius: 14px;
    padding: 1.25em 1.5em;
    overflow-x: auto;
    margin: 2em 0;
    & code {
      background: none;
      border: none;
      padding: 0;
      color: var(--color-ink);
      font-size: 0.85em;
    }
  }

  & table {
    width: 100%;
    border-collapse: collapse;
    margin: 2em 0;
    font-size: 0.9em;
    & th {
      text-align: left;
      padding: 0.6em 1em;
      border-bottom: 1px solid var(--color-line);
      font-family: var(--font-mono);
      font-size: 0.78em;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--color-muted);
    }
    & td {
      padding: 0.6em 1em;
      border-bottom: 1px solid var(--color-line-soft);
      color: var(--color-muted);
    }
    & tr:last-child td { border-bottom: none; }
  }
}
```

---

## 5. `components/SmoothScroll.tsx`

```tsx
"use client";
import Lenis from "lenis";
import { useEffect } from "react";

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis();
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);
  return <>{children}</>;
}
```

Wire it in `app/layout.tsx` wrapping `<body>` contents.

---

## 6. Theme Script (FOUC prevention)

Always inject this inline script in `<head>` before any stylesheets:

```html
<script>
  try {
    const t = localStorage.getItem('theme');
    if (t) document.documentElement.setAttribute('data-theme', t);
  } catch {}
</script>
```
