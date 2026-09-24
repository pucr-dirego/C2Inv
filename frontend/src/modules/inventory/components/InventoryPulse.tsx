import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CircleCheckBig,
} from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";

import type {
  InventoryOverview,
} from "../types/inventory.types";

export function InventoryPulse({
  data,
}: {
  data: InventoryOverview;
}) {
  const navigate = useNavigate();

  const active = Math.max(
    data.totals.activos,
    1,
  );

  const segments = [
    {
      key: "operativos",
      label: "Operativos",
      value:
        data.totals.operativos,
      className:
        "bg-emerald-500",
      icon: CircleCheckBig,
      route:
        "/inventory?active=active&statusCode=OPERATIVO",
    },
    {
      key: "observaciones",
      label: "Con observaciones",
      value:
        data.totals.observaciones,
      className:
        "bg-amber-400",
      icon: Activity,
      route:
        "/inventory?active=active&statusCode=OPERATIVO_OBSERVACIONES",
    },
    {
      key: "noOperativos",
      label: "No operativos",
      value:
        data.totals.noOperativos,
      className: "bg-red-500",
      icon: AlertTriangle,
      route:
        "/inventory?active=active&statusCode=NO_OPERATIVO",
    },
  ];

  return (
    <section className="overflow-hidden rounded-[30px] border border-black/[0.055] bg-white/72 p-6 shadow-[0_20px_60px_rgba(0,0,0,.065)] backdrop-blur-2xl sm:p-8">
      <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
        <button
          type="button"
          onClick={() =>
            navigate(
              "/inventory?active=active",
            )
          }
          className="group rounded-[22px] text-left outline-none transition hover:bg-black/[0.022] focus-visible:ring-4 focus-visible:ring-blue-500/10 lg:-m-3 lg:p-3"
        >
          <div className="flex items-center gap-2 text-xs font-medium text-(--text-tertiary)">
            Activos en alcance

            <ArrowUpRight
              size={13}
              className="opacity-0 transition group-hover:opacity-100"
            />
          </div>

          <motion.div
            initial={{
              opacity: 0,
              y: 12,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="mt-2 text-[clamp(4rem,9vw,7.5rem)] font-semibold leading-none tracking-[-0.075em]"
          >
            {data.totals.activos}
          </motion.div>

          <div className="mt-3 text-sm text-(--text-secondary)">
            {data.totals.inactivos >
            0
              ? `${data.totals.inactivos} registros inactivos fuera del pulso operativo.`
              : "Todos los registros actuales están activos."}
          </div>
        </button>

        <div>
          <div className="flex h-3 overflow-hidden rounded-full bg-black/[0.045]">
            {segments.map(
              (segment) => (
                <motion.div
                  key={segment.key}
                  initial={{
                    width: 0,
                  }}
                  animate={{
                    width: `${
                      (segment.value /
                        active) *
                      100
                    }%`,
                  }}
                  transition={{
                    duration: 0.7,
                    ease: [
                      0.22,
                      1,
                      0.36,
                      1,
                    ],
                  }}
                  className={
                    segment.className
                  }
                />
              ),
            )}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {segments.map(
              (segment) => {
                const Glyph =
                  segment.icon;

                return (
                  <motion.button
                    key={
                      segment.key
                    }
                    type="button"
                    whileHover={{
                      y: -2,
                    }}
                    whileTap={{
                      scale: 0.985,
                    }}
                    onClick={() =>
                      navigate(
                        segment.route,
                      )
                    }
                    className="group flex items-center gap-3 rounded-[16px] bg-black/[0.025] px-3 py-3 text-left outline-none transition hover:bg-black/[0.05] focus-visible:ring-4 focus-visible:ring-blue-500/10"
                  >
                    <Glyph
                      size={16}
                      strokeWidth={1.7}
                      className="text-(--text-secondary)"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="text-lg font-semibold tracking-[-0.03em]">
                        {
                          segment.value
                        }
                      </div>

                      <div className="truncate text-[10px] text-(--text-tertiary)">
                        {
                          segment.label
                        }
                      </div>
                    </div>

                    <ArrowUpRight
                      size={13}
                      className="shrink-0 text-black/15 transition group-hover:text-(--text-secondary)"
                    />
                  </motion.button>
                );
              },
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
