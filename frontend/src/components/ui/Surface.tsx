import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

type Material = "base" | "raised" | "glass" | "floating";
const materials: Record<Material,string> = {
  base: "border border-black/[0.05] bg-white/70 shadow-[var(--shadow-soft)]",
  raised: "border border-black/[0.055] bg-white/90 shadow-[var(--shadow-raised)]",
  glass: "border border-white/55 bg-white/55 shadow-[var(--shadow-raised)] backdrop-blur-2xl backdrop-saturate-150",
  floating: "border border-white/60 bg-white/92 shadow-[var(--shadow-floating)] backdrop-blur-3xl",
};
const radii = { control: "rounded-(--radius-control)", card: "rounded-(--radius-card)", large: "rounded-(--radius-large)" };

export function Surface({ children, material = "base", radius = "card", className, ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode; material?: Material; radius?: keyof typeof radii }) {
  return <div className={cn(materials[material], radii[radius], className)} {...props}>{children}</div>;
}
