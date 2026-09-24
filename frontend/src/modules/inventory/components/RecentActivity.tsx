import {
  Activity,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import type {
  InventoryOverview,
} from "../types/inventory.types";

function formatRelative(
  value: string,
) {
  const date = new Date(value);
  const diff =
    Date.now() - date.getTime();

  const minutes = Math.max(
    0,
    Math.floor(diff / 60000),
  );

  if (minutes < 1) return "ahora";
  if (minutes < 60) {
    return `hace ${minutes} min`;
  }

  const hours =
    Math.floor(minutes / 60);

  if (hours < 24) {
    return `hace ${hours} h`;
  }

  return `hace ${Math.floor(
    hours / 24,
  )} d`;
}

export function RecentActivity({
  data,
}: {
  data: InventoryOverview;
}) {
  const navigate = useNavigate();

  return (
    <section className="rounded-[28px] border border-black/[0.055] bg-white/70 p-5 shadow-sm backdrop-blur-xl sm:p-6">
      <div>
        <h2 className="text-xl font-semibold tracking-[-0.035em]">
          Actividad reciente
        </h2>

        <p className="mt-1 text-xs text-(--text-tertiary)">
          Cambios recientes en el inventario.
        </p>
      </div>

      <div className="mt-5 space-y-1">
        {data.recentActivity.length ===
        0 ? (
          <div className="py-8 text-center text-sm text-(--text-tertiary)">
            Aún no hay actividad registrada.
          </div>
        ) : (
          data.recentActivity
            .slice(0, 5)
            .map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  navigate(
                    `/inventory/equipment/${item.equipmentId}`,
                  )
                }
                className="flex w-full gap-3 rounded-[17px] px-3 py-3 text-left transition hover:bg-black/[0.04]"
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500/[0.09] text-blue-600">
                  <Activity
                    size={13}
                    strokeWidth={1.9}
                  />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {item.title}
                  </span>

                  <span className="mt-1 block truncate text-[11px] text-(--text-tertiary)">
                    {item.detail} ·{" "}
                    {item.branch}
                  </span>
                </span>

                <span className="whitespace-nowrap text-[10px] text-(--text-tertiary)">
                  {formatRelative(
                    item.occurredAt,
                  )}
                </span>
              </button>
            ),
          )
        )}
      </div>
    </section>
  );
}
