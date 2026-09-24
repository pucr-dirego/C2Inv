import type { ReactNode } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "../../lib/cn";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";
const variants: Record<Variant,string> = {
  primary: "bg-(--accent) text-white shadow-[0_7px_24px_rgba(0,122,255,.22)] hover:bg-(--accent-hover)",
  secondary: "border border-black/[0.07] bg-white/72 text-(--text-primary) shadow-sm backdrop-blur-xl hover:bg-white/95",
  ghost: "bg-transparent text-(--text-primary) hover:bg-black/[0.045]",
  danger: "bg-(--danger) text-white shadow-[0_7px_24px_rgba(255,59,48,.18)] hover:brightness-95",
};
const sizes: Record<Size,string> = { sm: "h-9 px-3.5 text-[13px]", md: "h-11 px-4.5 text-sm", lg: "h-12 px-5.5 text-[15px]" };

interface Props extends HTMLMotionProps<"button"> { children: ReactNode; variant?: Variant; size?: Size; loading?: boolean; leftIcon?: ReactNode; rightIcon?: ReactNode }
export function Button({ children, variant="primary", size="md", loading=false, leftIcon, rightIcon, disabled, className, type="button", ...props }: Props) {
  const off = Boolean(disabled) || loading;
  return (
    <motion.button type={type} disabled={off} whileHover={!off ? { y:-1, scale:1.008 } : undefined} whileTap={!off ? { scale:.985 } : undefined} transition={{ duration:.16, ease:[.22,1,.36,1] }} className={cn("relative inline-flex items-center justify-center gap-2 rounded-(--radius-control) font-medium tracking-[-0.01em] outline-none transition-[background-color,border-color,color,box-shadow,opacity] duration-150 focus-visible:ring-4 focus-visible:ring-(--accent-soft) disabled:pointer-events-none disabled:opacity-50", variants[variant], sizes[size], className)} {...props}>
      {loading ? <><Spinner size="sm"/><span>Procesando...</span></> : <>{leftIcon && <span className="flex shrink-0 items-center">{leftIcon}</span>}<span>{children}</span>{rightIcon && <span className="flex shrink-0 items-center">{rightIcon}</span>}</>}
    </motion.button>
  );
}
