import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border-[1.5px] border-hairline-light bg-surface-card px-3 py-2 text-[14px] text-ink placeholder:text-mute-light tracking-[0.1px]",
        "focus:outline-none focus:border-primary focus:border-[2.5px] focus:px-[10.5px] focus:py-[6.5px]",
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
