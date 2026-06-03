import * as React from 'react';
import { cn } from './utils';
import { hexToRgba } from './utils';

/** Status color map — matches the app's assessment statuses. */
export const STATUS_COLORS: Record<string, string> = {
  live: '#175CD3',
  draft: '#C98900',
  concluded: '#1A932E',
  scheduled: '#2D3D90',
  closed: '#BA1515',
  stopped: '#B5361A',
  success: '#129F66',
  error: '#DB4C5C',
  warning: '#C98900',
  info: '#175CD3',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** A key in STATUS_COLORS, or any hex string. */
  color?: string;
}

/**
 * Soft status pill: tinted background (10%), thin colored border, colored label.
 * <Badge color="live">Live</Badge>  |  <Badge color="#C62B6D">Custom</Badge>
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, color = 'info', style, children, ...props }, ref) => {
    const hex = STATUS_COLORS[color] ?? color;
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex w-fit items-center gap-0.5 rounded-full px-2 py-1.5 text-[10px] font-medium',
          className
        )}
        style={{
          color: hex,
          backgroundColor: hexToRgba(hex, 0.1),
          border: `0.25px solid ${hex}`,
          letterSpacing: '-0.02em',
          ...style,
        }}
        {...props}
      >
        {children}
      </span>
    );
  }
);
Badge.displayName = 'Badge';
