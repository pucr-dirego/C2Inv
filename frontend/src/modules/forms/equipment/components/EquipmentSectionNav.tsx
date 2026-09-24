import { Check } from "lucide-react";
import { motion } from "motion/react";

import { LiquidGlass } from "../../../../components/ui/LiquidGlass";
import { cn } from "../../../../lib/cn";

export interface EquipmentSection {
  id: string;
  number: string;
  label: string;
}

interface EquipmentSectionNavProps {
  sections: EquipmentSection[];
  activeIndex: number;
  complete: boolean[];
  requiredComplete: number;
  requiredTotal: number;
  onChange: (index: number) => void;
}

export function EquipmentSectionNav({
  sections,
  activeIndex,
  complete,
  requiredComplete,
  requiredTotal,
  onChange,
}: EquipmentSectionNavProps) {
  return (
    <LiquidGlass
      strength="clear"
      className="equipment-section-nav rounded-[22px] px-2 py-2"
    >
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max items-center gap-1">
            {sections.map((section, index) => {
              const active = index === activeIndex;
              const done = complete[index] ?? false;

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => onChange(index)}
                  className={cn(
                    "relative flex h-10 items-center gap-2 rounded-[14px] px-3 text-left outline-none transition-colors focus-visible:ring-4 focus-visible:ring-(--accent-soft)",
                    active
                      ? "text-(--text-primary)"
                      : "text-(--text-tertiary) hover:bg-black/[0.035] hover:text-(--text-secondary)",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="equipment-section-active"
                      className="absolute inset-0 rounded-[14px] border border-black/[0.045] bg-white/82 shadow-sm"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}

                  <span
                    className={cn(
                      "relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold",
                      done
                        ? "bg-(--accent) text-white"
                        : active
                          ? "bg-black text-white"
                          : "bg-black/[0.055] text-(--text-tertiary)",
                    )}
                  >
                    {done ? <Check size={11} strokeWidth={2.2} /> : section.number}
                  </span>

                  <span className="relative z-10 text-[12px] font-semibold">
                    {section.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="hidden shrink-0 border-l border-black/[0.065] px-3 text-right sm:block">
          <div className="text-[10px] font-semibold text-(--text-secondary)">
            {requiredComplete} de {requiredTotal}
          </div>
          <div className="text-[9px] text-(--text-tertiary)">requeridos</div>
        </div>
      </div>
    </LiquidGlass>
  );
}
