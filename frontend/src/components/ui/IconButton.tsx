import type { ReactNode } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "../../lib/cn";
const sizes = { sm:"h-8 w-8", md:"h-10 w-10", lg:"h-11 w-11" };
export function IconButton({ children, label, size="md", className, ...props }: HTMLMotionProps<"button"> & { children: ReactNode; label: string; size?: keyof typeof sizes }) {
  return <motion.button aria-label={label} whileHover={{ scale:1.035 }} whileTap={{ scale:.96 }} transition={{ duration:.14 }} className={cn("inline-flex items-center justify-center rounded-full border border-black/[0.055] bg-white/66 text-(--text-secondary) shadow-sm backdrop-blur-xl transition-colors hover:bg-white hover:text-(--text-primary) focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--accent-soft)", sizes[size], className)} {...props}>{children}</motion.button>;
}
