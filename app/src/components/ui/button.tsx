import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border-[1.5px] border-hairline-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:translate-y-[1px]",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-on-primary hover:bg-primary-pressed active:bg-primary-active",
        commerce: "bg-commerce text-on-commerce hover:bg-commerce-pressed",
        "secondary-light":
          "bg-canvas-light text-ink hover:bg-surface-soft",
        "secondary-dark":
          "bg-canvas-dark text-on-dark border-on-dark/40 hover:bg-surface-dark-elevated",
        mint: "bg-tint-mint text-tint-mint-fg hover:brightness-95",
        coral: "bg-tint-coral text-tint-coral-fg hover:brightness-95",
        destructive: "bg-warning text-on-dark hover:opacity-90",
        ghost:
          "bg-transparent text-ink border-transparent hover:bg-surface-soft hover:border-hairline-light",
        link:
          "bg-transparent text-link-light border-transparent underline-offset-4 hover:underline rounded-none px-0",
      },
      size: {
        lg: "h-11 px-6 text-[15px] font-bold tracking-[0.4px]",
        md: "h-9 px-4 text-[13px] font-semibold tracking-[0.3px]",
        sm: "h-7 px-3 text-[12px] font-medium",
        icon: "h-9 w-9",
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
