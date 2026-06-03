'use client';

import * as React from 'react';
import { DEFAULT_BRAND_COLOR } from './utils';

/**
 * Framework-agnostic brand-color theming — NO NextAuth / Next.js required.
 *
 * Provides the runtime brand color to any component and mirrors it onto the
 * `--brand` CSS variable so non-React / CSS-only code can re-theme too.
 *
 * Usage:
 *   <ThemeProvider brandColor={tenant.color}>
 *     <App />
 *   </ThemeProvider>
 *
 *   const brandColor = useBrandColor();
 *   <button style={{ backgroundColor: brandColor }} className="hover:opacity-90" />
 *   // or pure CSS: background: var(--brand)
 */
const BrandColorContext = React.createContext<string>(DEFAULT_BRAND_COLOR);

export interface ThemeProviderProps {
  /** Hex brand color from wherever your app stores it. Falls back to #C62B6D. */
  brandColor?: string | null;
  /** Also write the value to document root as `--brand` (default true). */
  syncCssVar?: boolean;
  children: React.ReactNode;
}

export function ThemeProvider({
  brandColor,
  syncCssVar = true,
  children,
}: ThemeProviderProps) {
  const color = brandColor || DEFAULT_BRAND_COLOR;

  React.useEffect(() => {
    if (syncCssVar && typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--brand', color);
    }
  }, [color, syncCssVar]);

  return (
    <BrandColorContext.Provider value={color}>
      {children}
    </BrandColorContext.Provider>
  );
}

/** Read the current brand color (always a valid hex; defaults to #C62B6D). */
export function useBrandColor(): string {
  return React.useContext(BrandColorContext);
}
