import {
  useMemo,
  useState,
} from "react";
import { motion } from "motion/react";
import {
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { SegmentedControl } from "../../../components/ui/SegmentedControl";
import type { InventoryOverview } from "../types/inventory.types";

type Mode =
  | "type"
  | "branch"
  | "department";

const BRANCH_PREVIEW_LIMIT = 6;

export function DistributionPanel({
  data,
}: {
  data: InventoryOverview;
}) {
  const [mode, setMode] =
    useState<Mode>("type");

  const [showAllBranches, setShowAllBranches] =
    useState(false);

  const items = useMemo(() => {
    if (mode === "branch") {
      return data.distribution.byBranch;
    }

    if (mode === "department") {
      return data.distribution.byDepartment;
    }

    return data.distribution.byType;
  }, [data, mode]);

  const visibleItems = useMemo(() => {
    if (mode !== "branch") {
      return items.slice(0, 10);
    }

    return showAllBranches
      ? items
      : items.slice(
          0,
          BRANCH_PREVIEW_LIMIT,
        );
  }, [
    items,
    mode,
    showAllBranches,
  ]);

  const max = Math.max(
    ...items.map(
      (item) => item.value,
    ),
    1,
  );

  const canExpandBranches =
    mode === "branch" &&
    items.length > BRANCH_PREVIEW_LIMIT;

  function changeMode(next: Mode) {
    setMode(next);
    setShowAllBranches(false);
  }

  return (
    <section className="rounded-[30px] border border-black/[0.055] bg-white/72 p-6 shadow-sm backdrop-blur-xl sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.04em]">
            Distribución
          </h2>

          <p className="mt-1 text-xs text-(--text-tertiary)">
            Dónde se concentra el inventario activo.
          </p>
        </div>

        <SegmentedControl
          value={mode}
          onChange={changeMode}
          options={[
            {
              value: "type",
              label: "Tipo",
            },
            {
              value: "branch",
              label: "Sucursal",
            },
            {
              value: "department",
              label: "Departamento",
            },
          ]}
        />
      </div>

      <div className="mt-7 space-y-4">
        {items.length === 0 ? (
          <div className="py-12 text-center text-sm text-(--text-tertiary)">
            No hay datos suficientes para distribuir.
          </div>
        ) : (
          visibleItems.map(
            (item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-[minmax(110px,180px)_1fr_42px] items-center gap-3"
              >
                <div className="truncate text-sm font-medium">
                  {item.nombre}
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-black/[0.045]">
                  <motion.div
                    key={`${mode}-${item.id}`}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${
                        (item.value / max) *
                        100
                      }%`,
                    }}
                    transition={{
                      duration: 0.5,
                      delay:
                        index * 0.025,
                      ease: [
                        0.22,
                        1,
                        0.36,
                        1,
                      ],
                    }}
                    className="h-full rounded-full bg-black"
                  />
                </div>

                <div className="text-right text-sm font-semibold tabular-nums">
                  {item.value}
                </div>
              </div>
            ),
          )
        )}
      </div>

      {canExpandBranches && (
        <div className="mt-6 border-t border-black/[0.055] pt-4">
          <button
            type="button"
            onClick={() =>
              setShowAllBranches(
                (current) => !current,
              )
            }
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-semibold text-(--text-secondary) transition hover:bg-black/[0.04] hover:text-(--text-primary)"
          >
            {showAllBranches ? (
              <>
                Ver menos
                <ChevronUp size={13} />
              </>
            ) : (
              <>
                Ver todas las sucursales
                <ChevronDown size={13} />
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
}
