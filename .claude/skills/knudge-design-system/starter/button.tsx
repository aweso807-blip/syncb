import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-pink-600 text-white hover:bg-pink-700',
        destructive: 'bg-red-500 text-white hover:bg-red-600',
        outline:
          'border border-gray-200 bg-white hover:bg-gray-50 text-gray-900',
        ghost: 'hover:bg-gray-100 text-gray-900',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

/**
 * Themeable primary CTA. Prefer this over variant="default" for tenant-facing
 * actions so the brand color re-themes per instance.
 *
 * <BrandButton brandColor={brandColor}>Save</BrandButton>
 */
export const BrandButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { brandColor?: string }
>(({ className, brandColor = '#C62B6D', style, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      'inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50',
      className
    )}
    style={{ backgroundColor: brandColor, ...style }}
    {...props}
  />
));
BrandButton.displayName = 'BrandButton';

export { Button, buttonVariants };
