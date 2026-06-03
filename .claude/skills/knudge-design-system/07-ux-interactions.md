# 07 · UX & Interaction Behavior

The *feel* of the system, not just the colors. Reproduce these behaviors and the experience transfers to any project.

## Motion & timing

| Token | Value | Use |
|-------|-------|-----|
| Default transition | `transition-colors` (~150ms) | Buttons, links, nav items, table rows, icon buttons |
| Opacity transition | `transition-opacity` | Themeable hover (`hover:opacity-90`) |
| Transform transition | `transition-transform` | Chevrons rotating on open/close |
| Toast enter | `0.35s cubic-bezier(0.21, 1.02, 0.73, 1)` | Slide-in from right (slight overshoot) |
| Toast exit | `0.2s ease-in` | Slide-out to right |
| Dialog/popover | `duration-200` + `animate-in/out` | fade + zoom-95 + slight slide |
| Tooltip | `fade-in-0 zoom-in-95` | quick, with `delayDuration={200}` |
| Skeleton | `animate-pulse` | loading placeholders |
| Spinner | `animate-spin` (lucide `Loader`/`RefreshCw`) | in-progress actions |

**Principle:** motion is quick and subtle. Enter animations may overshoot slightly (toast easing); exits are faster and linear. Nothing bounces hard or lingers.

## Interaction states (every interactive element)

| State | Treatment |
|-------|-----------|
| Hover (solid) | Darker shade (`hover:bg-pink-700`, `hover:bg-gray-50/100/200`) |
| Hover (themeable) | `hover:opacity-90` (never a hardcoded hover color) |
| Hover (subtle/ghost) | `hover:bg-gray-100` / row `hover:bg-gray-50` |
| Focus | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2` (themeable: `--tw-ring-color`) |
| Active/selected | Brand text + tinted bg + brand border (`text-[#C62B6D] bg-[#fcf4f8] border-[#C62B6D]`) or `tintColor(brand, 0.1)` row |
| Disabled | `disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none` |
| Loading | Replace label with spinner or show inline `Loader animate-spin`; keep the button sized; disable it |

**Always** give interactive elements a visible focus ring (keyboard accessibility) and a hover affordance.

## Feedback patterns

- **Toasts** for transient confirmation/errors — slide in top-right, auto-dismiss; success neutral card with brand bottom-border accent, errors use red text. (`05-patterns.md` for keyframes.)
- **Inline field errors** under inputs: `mt-1 flex items-center gap-1 text-red-600 text-xs` with a `h-3.5 w-3.5` icon and a one-word message (`Required` / `Duplicate` / `Invalid`). Error inputs go `border-red-500 bg-red-50`.
- **Alert boxes** for form-level messages: `bg-{green|red}-50 border border-{…}-200 text-{…}-700 px-4 py-3 rounded-lg text-sm`.
- **Empty states** are dashed, gray, centered, friendly: `flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500`.
- **Destructive actions** always go through a confirmation dialog (`rounded-2xl` modal) with a `destructive` button.

## Forms UX

- Labels above fields (`text-xs font-medium text-gray-700 mb-2`), helper text below in `text-gray-500`.
- Inputs are tall and comfortable (`h-12`, `px-4 py-3`) — generous, not cramped.
- Validate on submit/blur; surface the first error inline; keep the message terse.
- Leading icons sit inside the field (`pl-10/12` + absolutely positioned `h-5 w-5 text-gray-400`); password fields get a trailing eye toggle.
- Primary submit is full-width on auth/compact forms (`w-full`), brand-colored.

## Navigation & layout UX

- Sticky header (`sticky top-0 z-50`) stays visible while scrolling.
- Content is centered and capped (`max-w-7xl mx-auto`) — never full-bleed text.
- Active nav item carries the brand color; inactive is muted gray and brightens on hover.
- Dashboards are card grids (`grid … gap-6`) — scannable, equal-weight tiles.
- Icon-only actions get tooltips and `rounded-full` hover targets (`h-10 w-10`).

## Density & rhythm

- Default text is `text-sm` — the UI is information-dense but breathable via `gap-6` / `space-y-4` / `p-6`.
- Tables are compact (`px-4 py-2.5`) with row hover and light dividers (`divide-gray-50`).
- Whitespace increases with hierarchy: `mb-1 → mb-2 → mb-4 → mb-6 → mb-8`.

## Accessibility baseline

- Visible keyboard focus rings on everything interactive.
- Radix primitives provide ARIA roles, focus trapping (dialogs), and `data-[state]` hooks — keep using them.
- Color is never the only signal: pair status color with a label/icon.
- Hit targets ≥ `h-9`/`h-10`.

## The "same UX" checklist for a new project
1. Manrope loaded, `text-sm` body default.
2. `transition-colors` on all interactive elements + visible focus ring.
3. Hover affordance everywhere; `hover:opacity-90` for themeable surfaces.
4. Toasts for confirmations, inline errors for fields, dialogs for destructive actions.
5. Dashed friendly empty states; `animate-pulse` skeletons; spinner on pending actions.
6. Sticky capped-width layout; card-grid dashboards; brand-colored active states.
7. One configurable brand color via the theme provider (`08-portability.md` / `06-theming.md`).
