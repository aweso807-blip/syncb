# starter/ — copy-paste primitives

Drop these into a new project to bootstrap the Knudge design system.

| File | Destination | Notes |
|------|-------------|-------|
| `utils.ts` | `lib/utils.ts` | `cn()`, `tintColor()`, `hexToRgba()`, `DEFAULT_BRAND_COLOR` |
| `button.tsx` | `components/ui/button.tsx` | `Button` (cva variants) + `BrandButton` (themeable CTA) |
| `card.tsx` | `components/ui/card.tsx` | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` |
| `input.tsx` | `components/ui/input.tsx` | `Input` with `error` prop |
| `badge.tsx` | `components/ui/badge.tsx` | `Badge` + `STATUS_COLORS` map |
| `theme.tsx` | `components/theme.tsx` | `ThemeProvider` + `useBrandColor` — framework-agnostic theming, **no NextAuth needed** |

The imports here use `./utils`. After copying, change them to your alias (e.g. `@/lib/utils`).

## Dependencies
```bash
pnpm add clsx tailwind-merge class-variance-authority @radix-ui/react-slot lucide-react
pnpm add -D tailwindcss @tailwindcss/postcss
```

Then paste `../tokens.css` into `app/globals.css` and load Manrope (see `../02-typography.md`).
