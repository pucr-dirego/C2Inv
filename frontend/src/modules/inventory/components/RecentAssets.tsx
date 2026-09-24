import {
  ArrowRight,
  Laptop2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import type {
  InventoryOverview,
} from "../types/inventory.types";

export function RecentAssets({
  data,
}: {
  data: InventoryOverview;
}) {
  const navigate = useNavigate();

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.04em]">
            Registrados recientemente
          </h2>

          <p className="mt-1 text-xs text-(--text-tertiary)">
            Últimas altas del alcance actual.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate("/inventory")
          }
          className="text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          Ver inventario
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {data.recentAssets
          .slice(0, 4)
          .map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                navigate(
                  `/inventory/equipment/${item.id}`,
                )
              }
              className="group rounded-[24px] border border-black/[0.055] bg-white/72 p-5 text-left shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/92 hover:shadow-[0_18px_45px_rgba(0,0,0,.08)]"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-black text-white">
                  <Laptop2
                    size={18}
                    strokeWidth={1.6}
                  />
                </span>

                <ArrowRight
                  size={15}
                  className="text-black/20 transition group-hover:translate-x-0.5 group-hover:text-(--text-secondary)"
                />
              </div>

              <div className="mt-6 text-[11px] font-semibold text-(--text-tertiary)">
                {
                  item.numeroInventario
                }
              </div>

              <div className="mt-1 truncate text-base font-semibold tracking-[-0.025em]">
                {item.marca}{" "}
                {item.modelo ?? ""}
              </div>

              <div className="mt-2 truncate text-xs text-(--text-tertiary)">
                {
                  item.sucursalNombre
                }{" "}
                ·{" "}
                {
                  item.departamentoNombre
                }
              </div>
            </button>
          ))}
      </div>
    </section>
  );
}
