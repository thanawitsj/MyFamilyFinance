import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * PlayStation-inspired pill button — every CTA is rounded-full.
 * Sizes calibrated to design.md button-lg / button-md scale + touch-target ≥44px.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99]",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-on-primary hover:bg-primary-pressed active:bg-primary-active",
        commerce:
          "bg-commerce text-on-commerce hover:bg-commerce-pressed",
        "secondary-light":
          "bg-transparent text-ink border border-ash-light hover:bg-surface-soft",
        "secondary-dark":
          "bg-transparent text-on-dark border border-hairline-dark hover:bg-surface-dark-elevated",
        destructive:
          "bg-warning text-on-dark hover:opacity-90",
        ghost:
          "bg-transparent text-ink hover:bg-surface-soft",
        link:
          "bg-transparent text-link-light underline-offset-4 hover:underline rounded-none px-0",
      },
      size: {
        lg: "h-12 px-7 text-[18px] font-bold tracking-[0.45px]",
        md: "h-10 px-5 text-[14px] font-bold tracking-[0.324px]",
        sm: "h-8 px-4 text-[14px] font-medium",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { Button, buttonVariants };
