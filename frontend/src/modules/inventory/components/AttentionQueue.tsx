import {
  ArrowUpRight,
} from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";

import type {
  InventoryOverview,
} from "../types/inventory.types";
import { cn } from "../../../lib/cn";

export function AttentionQueue({
  data,
}: {
  data: InventoryOverview;
}) {
  const navigate = useNavigate();

  return (
    <section className="rounded-[28px] border border-black/[0.055] bg-white/70 p-5 shadow-sm backdrop-blur-xl sm:p-6">
      <div>
        <h2 className="text-xl font-semibold tracking-[-0.035em]">
          Necesita atención
        </h2>

        <p className="mt-1 text-xs text-(--text-tertiary)">
          {data.totals.requierenAtencion} activos tienen al menos una señal pendiente.
        </p>
      </div>

      <div className="mt-5 space-y-1.5">
        {data.attention.length === 0 ? (
          <div className="rounded-[18px] bg-emerald-500/[0.07] px-4 py-5 text-sm text-emerald-700">
            No hay pendientes operativos con las reglas actuales.
          </div>
        ) : (
          data.attention.map(
            (item, index) => (
              <motion.button
                key={item.key}
                type="button"
                initial={{
                  opacity: 0,
                  x: -8,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                transition={{
                  delay:
                    0.05 * index,
                }}
                onClick={() =>
                  navigate(
                    `/inventory?attention=${item.key}`,
                  )
                }
                className="group flex w-full items-center gap-3 rounded-[17px] px-3 py-3 text-left transition hover:bg-black/[0.04]"
              >
                <span
                  className={cn(
                    "h-2.5 w-2.5 shrink-0 rounded-full",
                    item.tone ===
                      "danger"
                      ? "bg-red-500"
                      : item.tone ===
                          "warning"
                        ? "bg-amber-400"
                        : "bg-black/20",
                  )}
                />

                <span className="min-w-0 flex-1 text-sm font-medium">
                  {item.label}
                </span>

                <strong className="text-sm tabular-nums">
                  {item.count}
                </strong>

                <ArrowUpRight
                  size={14}
                  className="text-black/20 transition group-hover:text-(--text-secondary)"
                />
              </motion.button>
            ),
          )
        )}
      </div>
    </section>
  );
}
