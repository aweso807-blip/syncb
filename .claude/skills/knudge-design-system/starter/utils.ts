import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes with conflict resolution. Use on every className. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Blend a hex color with white at the given opacity (0–1).
 * e.g. tintColor('#C62B6D', 0.05) -> a very light pink tint.
 * Use for soft tinted backgrounds, selected rows, hover fills.
 */
export function tintColor(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const tr = Math.round(r * opacity + 255 * (1 - opacity));
  const tg = Math.round(g * opacity + 255 * (1 - opacity));
  const tb = Math.round(b * opacity + 255 * (1 - opacity));
  return `#${tr.toString(16).padStart(2, '0')}${tg.toString(16).padStart(2, '0')}${tb.toString(16).padStart(2, '0')}`.toUpperCase();
}

/** Hex -> rgba string. Use for chart fills / opacity ramps. */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Default brand color — fallback wherever a runtime theme color is absent. */
export const DEFAULT_BRAND_COLOR = '#C62B6D';
