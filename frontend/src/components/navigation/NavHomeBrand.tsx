import { House } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";

import { cn } from "../../lib/cn";

interface NavHomeBrandProps {
  compact?: boolean;
  className?: string;
}

export function NavHomeBrand({
  compact = false,
  className,
}: NavHomeBrandProps) {
  const navigate = useNavigate();

  return (
    <motion.button
      type="button"
      aria-label="Ir al inicio"
      title="Inicio"
      onClick={() => navigate("/")}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.16 }}
      className={cn(
        "group flex items-center gap-3 rounded-[15px] text-left outline-none focus-visible:ring-4 focus-visible:ring-(--accent-soft)",
        className,
      )}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] border border-black/[0.065] bg-white/82 text-(--text-primary) shadow-sm backdrop-blur-xl transition group-hover:bg-white">
        <House
          size={17}
          strokeWidth={1.75}
        />
      </span>

      {!compact && (
        <span className="leading-tight">
          <span className="block text-[15px] font-semibold tracking-[-0.025em]">
            Inventarios TI
          </span>

          <span className="mt-0.5 block text-xs text-(--text-tertiary)">
            Sistema de Inventarios TI
          </span>
        </span>
      )}
    </motion.button>
  );
}
