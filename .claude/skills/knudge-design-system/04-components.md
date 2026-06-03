# 04 · Components

All class strings below are taken from production components. Copy-paste-ready primitives live in [`starter/`](./starter/).

---

## Button

Built with `cva`. Base + variants + sizes.

```
base:  inline-flex items-center justify-center rounded-md text-sm font-medium
       transition-colors focus-visible:outline-none focus-visible:ring-2
       focus-visible:ring-pink-500 focus-visible:ring-offset-2
       disabled:pointer-events-none disabled:opacity-50

variant.default     bg-pink-600 text-white hover:bg-pink-700      (static stand-in for brand)
variant.destructive bg-red-500 text-white hover:bg-red-600
variant.outline     border border-gray-200 bg-white hover:bg-gray-50 text-gray-900
variant.ghost       hover:bg-gray-100 text-gray-900
variant.secondary   bg-gray-100 text-gray-900 hover:bg-gray-200

size.default  h-10 px-4 py-2
size.sm       h-9  rounded-md px-3
size.lg       h-11 rounded-md px-8
size.icon     h-10 w-10
```

**Brand-aware primary** (themeable — preferred for CTAs):
```tsx
<button
  className="h-10 w-full rounded-xl text-sm font-medium text-white transition-colors hover:opacity-90"
  style={{ backgroundColor: brandColor }}  // brandColor from session, fallback '#C62B6D'
>
```

**Icon button** (header style): `h-10 w-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50`.

See `starter/button.tsx`.

---

## Input

```
flex h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm
placeholder:text-gray-400
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2
disabled:cursor-not-allowed disabled:opacity-50
```

- **Error state:** `border-red-500 bg-red-50 focus:ring-red-500`
- **With leading icon:** add `pl-10`/`pl-12`, absolutely position a `h-5 w-5 text-gray-400` icon.
- **Search box variant:** `rounded-full px-4 py-2 border border-gray-300 pl-12 focus:ring-2 focus:ring-[#C62B6D] focus:border-transparent`.
- **Brand focus ring (themeable):** apply `style={{ '--tw-ring-color': brandColor } as React.CSSProperties}` with `focus-visible:ring-2`.

### Label + helper + field error
```tsx
<label className="mb-2 block text-xs font-medium text-gray-700">Email</label>
<Input ... />
{/* field error */}
<div className="mt-1 flex items-center gap-1 text-red-600">
  <svg className="h-3.5 w-3.5 shrink-0" .../>
  <span className="text-xs">Required</span>
</div>
```

### Checkbox
Native input themed with `accentColor`:
```tsx
<input type="checkbox" className="h-4 w-4 rounded border-gray-300"
  style={{ accentColor: brandColor }} />
```
Selected row highlight: `style={{ backgroundColor: tintColor(brandColor, 0.1) }}`.

---

## Card

```
Card         rounded-2xl border border-gray-200 bg-white text-gray-950 shadow-sm
CardHeader   flex flex-col space-y-1.5 p-6
CardTitle    text-2xl font-semibold leading-none tracking-tight   (<h3>)
CardDescription  text-sm text-gray-500                            (<p>)
CardContent  p-6 pt-0
CardFooter   flex items-center p-6 pt-0
```

**Stat / KPI card:** `bg-white rounded-xl border border-gray-200 p-5` — label `text-sm text-gray-500`, value `text-2xl font-bold` (brand-colored).

See `starter/card.tsx`.

---

## Badge / Status pill

Generic soft pill:
```
inline-flex items-center gap-0.5 w-fit rounded-full px-2 py-1.5 text-[10px] font-medium
```
With inline color (status-driven):
```tsx
<span
  className="inline-flex items-center gap-0.5 w-fit rounded-full px-2 py-1.5 text-[10px] font-medium"
  style={{
    color: statusColor,
    backgroundColor: tint10,                    // rgba(...,0.1)
    border: `0.25px solid ${statusColor}`,
    fontFamily: 'Manrope',
    letterSpacing: '-0.02em',
  }}
>
  Live
</span>
```
Status → color map in [`01-color.md`](./01-color.md). See `starter/badge.tsx` for a typed variant version.

---

## Dialog / Modal (Radix `@radix-ui/react-dialog`)

```
Overlay   fixed inset-0 z-50 bg-black/50 backdrop-blur-sm
          data-[state=open]:animate-in data-[state=open]:fade-in-0
          data-[state=closed]:animate-out data-[state=closed]:fade-out-0

Content   fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg gap-4
          translate-x-[-50%] translate-y-[-50%]
          rounded-2xl border border-gray-200 bg-white p-6 shadow-lg duration-200
          data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=open]:fade-in-0
          data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=closed]:fade-out-0

Title     text-lg font-semibold leading-none tracking-tight text-gray-900
Desc      text-sm text-gray-600
Close btn absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100
          focus:ring-2 focus:ring-pink-500 focus:ring-offset-2
```

---

## Tabs (Radix `@radix-ui/react-tabs`)

Pattern: a `rounded-full`/`rounded-lg` list with an active tab carrying the brand color (text or underline) and inactive tabs in `text-gray-500 hover:text-gray-700`. Active: `text-[#C62B6D] font-medium` (or themeable `style={{ color: brandColor }}`).

---

## Dropdown / Multi-select (Radix `@radix-ui/react-dropdown-menu`)

```
Trigger   flex items-center justify-between rounded-full px-4 py-2
          border border-gray-300 bg-[#F2F2F2] min-w-[250px] text-left
          focus:ring-2 focus:ring-[#C62B6D] focus:border-transparent
Content   bg-white border border-gray-200 rounded-lg shadow-lg p-1 min-w-[200px] z-50
Item      flex items-center px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer outline-none
Item(sel) bg-[#fcf4f8] text-[#C62B6D] border border-[#C62B6D]
Chevron   ChevronDown h-4 w-4 transition-transform
```
Custom dropdown menu container: `rounded-xl border border-gray-200 bg-white shadow-xl`. Selected item: `text-[#C62B6D] font-medium`.

---

## Tooltip (Radix `@radix-ui/react-tooltip`)

```
Content  z-50 overflow-hidden rounded-md border border-gray-200 bg-white
         px-3 py-2 text-sm text-gray-700 shadow-md max-w-xs
         animate-in fade-in-0 zoom-in-95
         data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95
Trigger  inline-flex shrink-0 rounded-full text-gray-400 hover:text-gray-600
         focus:ring-2 focus:ring-[#C62B6D] focus:ring-offset-1
```
Wrap the app in `<TooltipProvider delayDuration={200}>`.

---

## Table

```
container  bg-white rounded-xl border border-gray-100
thead tr   border-b border-gray-100 bg-gray-50
th         px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide
           (data-table heavy variant: px-6 py-3 font-bold text-black)
tbody      divide-y divide-gray-50
tr         hover:bg-gray-50 transition-colors
td         px-4 py-2.5 text-gray-700 text-sm
```
Sort icons: lucide `ChevronUp/Down` `w-3 h-3`, inactive `text-gray-300`, active `text-gray-700`.
Pagination footer: `px-4 py-3 border-t border-gray-100 text-sm text-gray-500`, nav buttons `p-1.5 rounded hover:bg-gray-100 disabled:opacity-40`.

---

## Icons (lucide-react)

| Size | Use |
|------|-----|
| `h-3 w-3` | sort indicators, micro |
| `h-3.5 w-3.5` | inline accents |
| `h-4 w-4` | **standard button/input icons** |
| `h-5 w-5` | page-level icons |
| `h-6 w-6` | larger accents |

Default color `text-gray-400`, hover `text-gray-600`. Common: `Search, ChevronDown, X, Plus, Download, Mail, Settings, Bell, User, Trash2, Pencil, RefreshCw, Loader (animate-spin)`.
