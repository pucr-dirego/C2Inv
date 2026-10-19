import {
  Activity,
  ArrowUpRight,
  Building2,
  CircleAlert,
  Laptop2,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { motion } from "motion/react";

import { cn } from "../../../lib/cn";
import { formatInteger } from "../data/analytics.utils";
import type {
  AnalyticsBranch,
  AnalyticsScopeSummary,
} from "../types/analytics.types";

function MiniStat({
  icon: Glyph,
  label,
  value,
  tone = "neutral",
}: {
  icon: typeof Laptop2;
  label: string;
  value: number;
  tone?: "neutral" | "good" | "warn";
}) {
  return (
    <div className="analytics-detail-stat rounded-[18px] p-3.5">
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-[11px]",
          tone === "good" && "analytics-icon-good",
          tone === "warn" && "analytics-icon-warn",
          tone === "neutral" && "analytics-icon-neutral",
        )}
      >
        <Glyph size={14} strokeWidth={1.7} />
      </div>

      <div className="mt-5 text-[22px] font-semibold tracking-[-0.035em]">
        {formatInteger(value)}
      </div>
      <div className="mt-1 text-[10px] font-medium text-(--text-tertiary)">
        {label}
      </div>
    </div>
  );
}

export function ScopeDetailPanel({
  summary,
  selectedBranch,
  regionBranches,
  onSelectBranch,
}: {
  summary: AnalyticsScopeSummary;
  selectedBranch: AnalyticsBranch | null;
  regionBranches: AnalyticsBranch[];
  onSelectBranch: (branch: AnalyticsBranch) => void;
}) {
  return (
    <motion.aside
      key={`${summary.title}-${selectedBranch?.id ?? "scope"}`}
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      className="analytics-detail-panel flex min-h-[540px] flex-col rounded-[28px] p-5 sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-(--text-tertiary)">
            {selectedBranch ? (
              <MapPin size={12} />
            ) : (
              <Building2 size={12} />
            )}
            {selectedBranch ? "Sucursal" : "Vista geográfica"}
          </div>

          <h2 className="mt-3 truncate text-[28px] font-semibold leading-none tracking-[-0.045em]">
            {summary.title}
          </h2>

          <p className="mt-2 text-[12px] text-(--text-secondary)">
            {summary.subtitle}
          </p>
        </div>

        <span className="analytics-live-pill inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          PostgreSQL
        </span>
      </div>

      <div className="mt-8">
        <div className="text-[58px] font-semibold leading-[0.88] tracking-[-0.065em]">
          {formatInteger(summary.equipment)}
        </div>
        <div className="mt-3 text-[12px] text-(--text-secondary)">
          equipos en el alcance seleccionado
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2.5">
        <MiniStat
          icon={ShieldCheck}
          label="Operativos"
          value={summary.operational}
          tone="good"
        />
        <MiniStat
          icon={CircleAlert}
          label="Atención"
          value={summary.attention}
          tone="warn"
        />
        <MiniStat
          icon={Activity}
          label="No operativos"
          value={summary.offline}
        />
      </div>

      {selectedBranch ? (
        <div className="analytics-meta-strip mt-5 grid grid-cols-2 gap-3 rounded-[20px] p-4">
          <div>
            <div className="text-[9px] uppercase tracking-[0.12em] text-(--text-tertiary)">
              Código
            </div>
            <div className="mt-1 text-xs font-semibold">
              {selectedBranch.code}
            </div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-[0.12em] text-(--text-tertiary)">
              Último movimiento
            </div>
            <div className="mt-1 text-xs font-semibold">
              {selectedBranch.lastSyncLabel}
            </div>
          </div>
        </div>
      ) : regionBranches.length > 0 ? (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-(--text-tertiary)">
              Sucursales en esta vista
            </div>
            <span className="text-[11px] text-(--text-tertiary)">
              {regionBranches.length}
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {regionBranches.slice(0, 4).map((branch) => (
              <button
                key={branch.id}
                type="button"
                onClick={() => onSelectBranch(branch)}
                className="analytics-branch-row group flex w-full items-center justify-between rounded-[16px] px-3.5 py-3 text-left"
              >
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold">
                    {branch.name}
                  </div>
                  <div className="mt-1 text-[10px] text-(--text-tertiary)">
                    {formatInteger(branch.equipment)} equipos
                  </div>
                </div>
                <ArrowUpRight
                  size={14}
                  className="shrink-0 text-(--text-tertiary) transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-6 text-[11px] leading-5 text-(--text-tertiary)">
          No hay sucursales georreferenciadas dentro de esta región para tu alcance actual.
        </div>
      )}

      <div className="mt-auto pt-6 text-[10px] leading-4 text-(--text-tertiary)">
        Datos consultados desde Inventarios TI. Las coordenadas actuales son
        aproximadas a nivel ciudad hasta validar las ubicaciones físicas.
      </div>
    </motion.aside>
  );
}
