import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Airtable-inspired button variants
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        // Airtable primary - solid blue
        default:
          'bg-primary text-primary-foreground shadow-airtable-sm hover:bg-primary/90 active:scale-[0.98]',
        // Airtable danger - solid red
        destructive:
          'bg-destructive text-destructive-foreground shadow-airtable-sm hover:bg-destructive/90 active:scale-[0.98]',
        // Airtable outline/secondary - bordered style
        outline:
          'border border-border bg-card text-foreground shadow-airtable-sm hover:bg-muted hover:border-muted-foreground/30 active:scale-[0.98]',
        // Airtable secondary - subtle background
        secondary:
          'bg-muted text-foreground shadow-airtable-sm hover:bg-muted/80 active:scale-[0.98]',
        // Airtable ghost/text button
        ghost:
          'text-foreground hover:bg-muted hover:text-foreground',
        // Airtable link style
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        // Airtable uses compact sizing
        default: 'h-9 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-10 px-6',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
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

export { Button, buttonVariants };
