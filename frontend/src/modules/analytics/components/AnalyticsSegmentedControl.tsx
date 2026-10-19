import { motion } from "motion/react";

import { cn } from "../../../lib/cn";

interface AnalyticsSegmentedControlProps<T extends string> {
  value: T;
  options: Array<{
    value: T;
    label: string;
  }>;
  onChange: (value: T) => void;
  layoutId: string;
  className?: string;
}

export function AnalyticsSegmentedControl<T extends string>({
  value,
  options,
  onChange,
  layoutId,
  className,
}: AnalyticsSegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        "analytics-segmented inline-flex rounded-full p-1",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className="relative min-h-10 flex-1 rounded-full px-4 text-[12px] font-semibold"
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="analytics-segmented-pill absolute inset-0 rounded-full"
                transition={{
                  type: "spring",
                  stiffness: 420,
                  damping: 34,
                }}
              />
            )}

            <span
              className={cn(
                "relative z-10 whitespace-nowrap transition-colors",
                active
                  ? "text-(--text-primary)"
                  : "text-(--text-tertiary)",
              )}
            >
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
