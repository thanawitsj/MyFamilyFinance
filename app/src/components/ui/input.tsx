import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * design.md text-input — rounded-sm (4px), 48px height, 2px primary border on focus
 * Letter-spacing and weight follow body-md (18px / 400 / 0.1px).
 */
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-12 w-full rounded-sm border border-ash-light bg-canvas-light px-4 py-3 text-[16px] text-ink placeholder:text-mute-light tracking-[0.1px]",
        "focus:outline-none focus:border-primary focus:border-2 focus:px-[15px] focus:py-[11px]",
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
