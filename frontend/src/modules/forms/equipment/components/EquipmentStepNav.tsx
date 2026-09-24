import { Check } from "lucide-react";
import { motion } from "motion/react";

import { cn } from "../../../../lib/cn";

export interface EquipmentStep {
  id: string;
  label: string;
  eyebrow: string;
}

interface EquipmentStepNavProps {
  steps: EquipmentStep[];
  current: number;
  completedSteps?: ReadonlySet<number>;
  onStepChange?: (index: number) => void;
}

export function EquipmentStepNav({
  steps,
  current,
  completedSteps,
  onStepChange,
}: EquipmentStepNavProps) {
  return (
    <div className="flex items-center overflow-x-auto pb-1">
      {steps.map((step, index) => {
        const complete =
          completedSteps?.has(index) ??
          index < current;

        const active = index === current;

        return (
          <div
            key={step.id}
            className="flex min-w-max flex-1 items-center"
          >
            <motion.button
              type="button"
              aria-current={active ? "step" : undefined}
              onClick={() => onStepChange?.(index)}
              whileHover={
                onStepChange
                  ? { y: -1 }
                  : undefined
              }
              whileTap={
                onStepChange
                  ? { scale: 0.985 }
                  : undefined
              }
              transition={{
                duration: 0.14,
              }}
              className={cn(
                "group flex items-center gap-2.5 rounded-[15px] px-1 py-1 text-left outline-none",
                "focus-visible:ring-4 focus-visible:ring-(--accent-soft)",
                onStepChange &&
                  "cursor-pointer",
              )}
            >
              <motion.div
                animate={{
                  backgroundColor:
                    complete || active
                      ? "#007aff"
                      : "rgba(0,0,0,.045)",
                  color:
                    complete || active
                      ? "#ffffff"
                      : "#8e8e93",
                }}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold",
                  !active &&
                    "group-hover:ring-4 group-hover:ring-black/[0.035]",
                )}
              >
                {complete ? (
                  <Check
                    size={13}
                    strokeWidth={2.1}
                  />
                ) : (
                  index + 1
                )}
              </motion.div>

              <div className="hidden sm:block">
                <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-(--text-tertiary)">
                  {step.eyebrow}
                </div>

                <div
                  className={cn(
                    "mt-0.5 text-xs font-semibold transition-colors",
                    active
                      ? "text-(--text-primary)"
                      : "text-(--text-tertiary) group-hover:text-(--text-secondary)",
                  )}
                >
                  {step.label}
                </div>
              </div>
            </motion.button>

            {index <
              steps.length - 1 && (
              <div className="mx-3 h-px min-w-6 flex-1 bg-black/[0.065]" />
            )}
          </div>
        );
      })}
    </div>
  );
}
