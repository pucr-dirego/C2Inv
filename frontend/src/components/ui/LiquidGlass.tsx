import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

interface LiquidGlassProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  strength?: "regular" | "clear";
}

export function LiquidGlass({
  children,
  strength = "regular",
  className,
  ...props
}: LiquidGlassProps) {
  return (
    <div
      className={cn(
        "liquid-glass",
        strength === "clear" && "liquid-glass--clear",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
