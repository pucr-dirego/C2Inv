import { motion } from "motion/react";

import { formatInteger } from "../data/analytics.utils";
import type { AnalyticsBreakdownItem } from "../types/analytics.types";

export function DistributionBars({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: AnalyticsBreakdownItem[];
}) {
  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <section className="analytics-card rounded-[28px] p-5 sm:p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-(--text-tertiary)">
            Distribución
          </div>
          <h3 className="mt-2 text-[22px] font-semibold tracking-[-0.035em]">
            {title}
          </h3>
          <p className="mt-1 text-[11px] text-(--text-secondary)">
            {subtitle}
          </p>
        </div>
      </div>

      {items.length ? (
        <div className="mt-7 space-y-5">
          {items.slice(0, 5).map((item, index) => (
            <div key={item.label}>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[12px] font-medium">
                  {item.label}
                </span>
                <span className="text-[11px] font-semibold text-(--text-secondary)">
                  {formatInteger(item.value)}
                </span>
              </div>

              <div className="analytics-bar-track mt-2.5 h-2 overflow-hidden rounded-full">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(item.value / max) * 100}%`,
                  }}
                  transition={{
                    delay: index * 0.04,
                    duration: 0.55,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="analytics-bar-fill h-full rounded-full"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-7 flex min-h-[170px] items-center justify-center rounded-[20px] border border-black/[0.05] px-6 text-center text-[11px] leading-5 text-(--text-tertiary)">
          Todavía no hay equipos activos para construir esta distribución.
        </div>
      )}
    </section>
  );
}
