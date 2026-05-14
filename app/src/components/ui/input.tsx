import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Pastel-friendly input — 1.5px dark border, 10px radius, white card surface.
 * Focus state thickens border to 2.5px in primary color.
 */
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-12 w-full rounded-md border-[1.5px] border-hairline-light bg-surface-card px-4 py-3 text-[16px] text-ink placeholder:text-mute-light tracking-[0.1px]",
        "focus:outline-none focus:border-primary focus:border-[2.5px] focus:px-[15.5px] focus:py-[10.5px]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
