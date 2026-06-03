# 05 · Layout & Patterns

## Page shell

```
<div className="min-h-screen bg-gray-50">          {/* or bg-[#f9f9f9] */}
  <header className="sticky top-0 z-50 bg-gray-50">
    <div className="flex items-center justify-between px-8 py-6">  {/* or px-[40px] pt-[20px] */}
      …logo…  …center title…  …actions…
    </div>
  </header>
  <main className="max-w-7xl mx-auto px-[40px] py-8">  {/* or px-8 py-8 */}
    …content…
  </main>
</div>
```

- **Content width:** `max-w-7xl mx-auto`.
- **Page padding:** `px-[40px] py-8` (dashboard) or `px-8 py-8` (standard).
- **Header:** `sticky top-0 z-50`, `flex items-center justify-between`. Left = logo (`h-[37px] w-auto shrink-0`), center = page title (absolutely centered on `lg`), right = icon buttons + avatar.

## Navigation / header items

- **Icon buttons:** `h-10 w-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors`.
- **Groups:** `flex items-center gap-2`.
- **User avatar:** `h-9 w-9 rounded-full border border-white bg-gradient-to-br from-blue-400 to-purple-500`.
- **Active vs inactive nav:** active uses brand color (`style={{ color: brandColor }}` or `text-[#C62B6D] font-medium`); inactive `text-gray-500 hover:text-gray-700`.

## Card grids

```
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
```
The `gap-6` three-column responsive grid is the primary dashboard layout.

## Auth pages (split + centered card)

```
h-screen relative overflow-hidden
  bg image + overlay: absolute inset-0 bg-gradient-to-br from-black/30 to-black/50
  flex flex-col lg:flex-row
    left  (hidden lg:flex): branding, px-8 xl:px-16 py-12 flex-1, hero text-white
    right (flex items-center justify-end): the form card
form card: bg-white rounded-3xl shadow-xl px-10 py-12 max-w-[390px]
  title: text-xl font-bold text-gray-900 mb-1
  fields: space-y-4, rounded-xl inputs with leading icons
  submit: full-width brand button (rounded-xl)
```

## Toasts

Slide in from the right; defined in `globals.css`:

```css
@keyframes toastEnter { from { transform: translateX(calc(100% + 1.5rem)); opacity: 0 }
                        to   { transform: translateX(0); opacity: 1 } }
@keyframes toastExit  { from { transform: translateX(0); opacity: 1 }
                        to   { transform: translateX(calc(100% + 1.5rem)); opacity: 0 } }
.toast-enter { animation: toastEnter 0.35s cubic-bezier(0.21,1.02,0.73,1) forwards; }
.toast-exit  { animation: toastExit  0.2s ease-in forwards; }
```
Toast card: `rounded-xl border border-gray-200 bg-gray-50 px-5 py-3 shadow-lg`, often with a `3px` brand-colored bottom border (`style={{ borderBottom: \`3px solid ${brandColor}\` }}`).

## Empty states

```
flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-200
bg-gray-50 text-sm text-gray-500
```

## Loading skeletons

```
animate-pulse  +  h-… bg-gray-200 rounded   (stacked placeholder blocks)
```
Spinners: lucide `Loader`/`RefreshCw` with `animate-spin`, `h-5 w-5` / `h-10 w-10`.

## Error blocks

```
bg-red-50 border border-red-200 rounded-lg p-6 text-center
  h2: text-lg font-semibold text-red-800 mb-2
  p:  text-red-600
```

## Charts

- Use **chart.js + react-chartjs-2** (and/or recharts).
- Gauge/doughnut: `cutout: '85%'`, semicircle (`circumference: 180`, `rotation: 270`), fill `[brandColor, 'rgb(229,231,235)']`.
- Bars: `borderRadius: 4`, `barThickness: 20–50`.
- Grid: `strokeDasharray "3 3"`, `vertical={false}`, axis ticks `fontSize: 11–12`, color `#374151`.
- Progress bar: track `w-full bg-gray-200 rounded-full h-2`, fill `h-2 rounded-full` with `style={{ width: \`${pct}%\`, backgroundColor: color }}`.
- Palette + brand opacity ramp: see [`01-color.md`](./01-color.md).
