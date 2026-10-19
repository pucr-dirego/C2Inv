import {
  Building2,
  CircleAlert,
  Laptop2,
  ShieldCheck,
} from "lucide-react";
import { motion } from "motion/react";

import { formatInteger } from "../data/analytics.utils";
import type { AnalyticsScopeSummary } from "../types/analytics.types";

export function AnalyticsKpis({
  summary,
}: {
  summary: AnalyticsScopeSummary;
}) {
  const items = [
    {
      label: "Equipos",
      value: summary.equipment,
      helper: `${formatInteger(summary.active)} activos`,
      icon: Laptop2,
    },
    {
      label: "Operativos",
      value: summary.operational,
      helper: summary.equipment
        ? `${Math.round((summary.operational / summary.equipment) * 100)}% del inventario`
        : "Sin inventario",
      icon: ShieldCheck,
    },
    {
      label: "Atención",
      value: summary.attention,
      helper: summary.attention
        ? "requieren revisión"
        : "sin alertas",
      icon: CircleAlert,
    },
    {
      label: "Sucursales",
      value: summary.branches,
      helper: "en la vista actual",
      icon: Building2,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item, index) => {
        const Glyph = item.icon;

        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.035 * index,
              duration: 0.38,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="analytics-kpi-card rounded-[24px] p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-(--text-tertiary)">
                  {item.label}
                </div>

                <div className="mt-4 text-[34px] font-semibold leading-none tracking-[-0.045em]">
                  {formatInteger(item.value)}
                </div>

                <div className="mt-2 text-[12px] text-(--text-secondary)">
                  {item.helper}
                </div>
              </div>

              <span className="analytics-kpi-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px]">
                <Glyph size={17} strokeWidth={1.6} />
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
