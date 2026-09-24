import { motion } from "motion/react";
import { cn } from "../../lib/cn";

export function SignalLine({ className, active = true, label = "Sistema disponible" }: { className?: string; active?: boolean; label?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative h-px min-w-24 flex-1 bg-black/[0.08]">
        <motion.span
          className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-(--accent)"
          animate={{ left: active ? ["4%", "82%", "38%", "68%"] : "4%", opacity: active ? [0.55,1,0.72,1] : 0.35 }}
          transition={{ duration: 8, repeat: active ? Infinity : 0, ease: "easeInOut" }}
          style={{ boxShadow: "0 0 0 5px rgba(0,122,255,.08), 0 0 22px rgba(0,122,255,.24)" }}
        />
      </div>
      <span className="whitespace-nowrap text-[11px] font-medium tracking-[0.02em] text-(--text-tertiary)">{label}</span>
    </div>
  );
}
