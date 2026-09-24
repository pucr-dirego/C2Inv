import { motion } from "motion/react";

import logo from "../../assets/inventarios-ti-logo.png";
import { cn } from "../../lib/cn";

interface BrandMarkProps {
  className?: string;
  compact?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
};

export function BrandMark({
  className,
  compact = false,
  size = "md",
}: BrandMarkProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.28,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn(
        "flex items-center gap-3",
        className,
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden rounded-[13px] border border-black/[0.055] bg-white/82 p-1.5 shadow-sm backdrop-blur-xl",
          sizes[size],
        )}
      >
        <img
          src={logo}
          alt=""
          className="h-full w-full object-contain"
        />
      </div>

      {!compact && (
        <div className="leading-tight">
          <div className="text-[15px] font-semibold tracking-[-0.025em]">
            Inventarios TI
          </div>

          <div className="mt-0.5 text-xs text-(--text-tertiary)">
            Sistema de Inventarios TI
          </div>
        </div>
      )}
    </motion.div>
  );
}
