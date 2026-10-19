import { ArrowUpRight } from "lucide-react";

import { formatInteger } from "../data/analytics.utils";
import type { AnalyticsBranch } from "../types/analytics.types";

export function BranchRanking({
  branches,
  onSelect,
}: {
  branches: AnalyticsBranch[];
  onSelect: (branch: AnalyticsBranch) => void;
}) {
  const sorted = [...branches].sort(
    (a, b) => b.equipment - a.equipment,
  );

  return (
    <section className="analytics-card rounded-[28px] p-5 sm:p-6">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-(--text-tertiary)">
        Sucursales
      </div>
      <h3 className="mt-2 text-[22px] font-semibold tracking-[-0.035em]">
        Mayor inventario
      </h3>

      <div className="mt-5 divide-y divide-black/[0.05]">
        {sorted.slice(0, 5).map((branch, index) => (
          <button
            key={branch.id}
            type="button"
            onClick={() => onSelect(branch)}
            className="group flex w-full items-center gap-3 py-3 text-left"
          >
            <span className="w-6 text-[10px] font-semibold text-(--text-tertiary)">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-semibold">
                {branch.name}
              </div>
              <div className="mt-1 truncate text-[10px] text-(--text-tertiary)">
                {branch.region}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[12px] font-semibold">
                {formatInteger(branch.equipment)}
              </div>
              <div className="mt-1 text-[9px] text-(--text-tertiary)">
                equipos
              </div>
            </div>
            <ArrowUpRight
              size={14}
              className="text-(--text-tertiary) transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </button>
        ))}
      </div>
    </section>
  );
}
