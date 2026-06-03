# 03 · Spacing, Radius & Shadow

## Border radius scale (the signature of this system)

| Class | Value | Used for |
|-------|-------|----------|
| `rounded-md` | 6px | Buttons (base), small menu items |
| `rounded-lg` | 8px | Alert boxes, menus, secondary containers |
| `rounded-xl` | 12px | **Inputs, small cards, toasts, dropdown menus** |
| `rounded-2xl` | 16px | **Major cards, dialogs/modals** |
| `rounded-3xl` | 24px | Large auth form cards |
| `rounded-[20px]` | 20px | Assessment highlight cards |
| `rounded-full` | pill | Status badges, search boxes, avatars, multi-select triggers, progress tracks |
| `rounded-[43px]` / `[45px]` | — | Special gradient-bordered "create" card |

**Rule of thumb:** input-sized things = `rounded-xl`; card-sized things = `rounded-2xl`; anything pill-like = `rounded-full`.

## Spacing rhythm

| Class | Typical use |
|-------|-------------|
| `gap-0.5` / `gap-1` | Icon + label inside a pill |
| `gap-2` | Tight icon/button groups |
| `gap-3` | Form field rows, swatch + input |
| `gap-4` | Content sections |
| `gap-6` | **Primary grid gap** (card grids) |
| `space-y-1.5` | Card header internal spacing |
| `space-y-4` | Compact form stacks |
| `space-y-6` | Generous form stacks |
| `mb-1 / mb-2` | Title→subtitle, label→field |
| `mb-4 / mb-6 / mb-8` | Section separation (increasing) |

### Padding standards

| Context | Padding |
|---------|---------|
| Card (header / content / footer) | `p-6`, content `p-6 pt-0` |
| Small / stat card | `p-4` – `p-5` |
| Dialog | `p-6` |
| Input | `px-4 py-3` (height `h-12`) |
| Button (default) | `px-4 py-2` (height `h-10`) |
| Table cell | header `px-4 py-2.5` / `px-6 py-3`; body `px-4 py-2.5` / `px-6 py-4` |
| Pill / badge | `px-2 py-1.5` |
| Page container | `max-w-7xl mx-auto px-[40px] py-8` (or `px-8 py-6`) |

## Shadows

| Class | Used for |
|-------|----------|
| `shadow-sm` | **Default for cards** (paired with a border) |
| `shadow-md` | Tooltips |
| `shadow-lg` | Dialogs, toasts, dropdown content |
| `shadow-xl` | Large floating menus, auth cards |
| none | Inputs, buttons, tables (borders carry the structure) |

Shadows are subtle and always secondary to the `border border-gray-200`. Never use heavy/dark shadows.

## Borders & dividers

- Default border: `border border-gray-200`
- Light divider rows: `divide-y divide-gray-50` / `border-b border-gray-100`
- Dashed (empty states, parameter cards): `border border-dashed border-gray-200` / `border-2 border-dashed border-blue-200`
- Error: `border-red-200/500` · Warning: `border-amber-300`
