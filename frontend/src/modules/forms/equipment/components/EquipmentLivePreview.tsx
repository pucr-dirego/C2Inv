import {
  Building2,
  Cpu,
  Laptop2,
  MapPin,
  Monitor,
  Network,
  ShieldCheck,
  Tablet,
} from "lucide-react";
import { motion } from "motion/react";

import type {
  EquipmentCatalogs,
  EquipmentFormValues,
} from "../types/equipment.types";

interface EquipmentLivePreviewProps {
  values: EquipmentFormValues;
  catalogs: EquipmentCatalogs | null;
}

function resolveItem(
  items: { id: string; nombre: string; codigo: string }[] | undefined,
  id: string,
) {
  return items?.find((item) => item.id === id);
}

export function EquipmentLivePreview({
  values,
  catalogs,
}: EquipmentLivePreviewProps) {
  const tipoItem = resolveItem(
    catalogs?.tiposEquipo,
    values.tipoEquipoId,
  );

  const tipo = tipoItem?.nombre ?? "Equipo";
  const isTablet = tipoItem?.codigo === "TABLET";
  const isDesktop = tipoItem?.codigo === "DESKTOP";

  const sucursal =
    resolveItem(
      catalogs?.sucursales,
      values.sucursalId,
    )?.nombre ?? "Sin sucursal";

  const departamento =
    resolveItem(
      catalogs?.departamentos,
      values.departamentoId,
    )?.nombre ?? "Sin departamento";

  const estado =
    resolveItem(
      catalogs?.estadosFuncionamiento,
      values.estadoFuncionamientoId,
    )?.nombre ?? "Sin estado";

  const DeviceIcon = isTablet
    ? Tablet
    : isDesktop
      ? Monitor
      : Laptop2;

  return (
    <div className="sticky top-24">
      <div className="mb-4">
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-(--text-tertiary)">
          Vista previa
        </div>
        <div className="mt-1 text-sm font-semibold">
          El activo toma forma mientras capturas.
        </div>
      </div>

      <motion.div
        layout
        className="equipment-device-shell rounded-[32px] p-3"
      >
        <div className="equipment-device-screen relative min-h-[380px] overflow-hidden rounded-[25px] p-6 text-white">
          <div className="absolute inset-0 opacity-40">
            <div className="absolute left-[18%] top-[15%] h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />
          </div>

          <div className="relative flex items-center justify-between">
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/34">
                Sistema de Inventarios TI
              </div>
              <motion.div
                key={tipo}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1 text-sm font-semibold text-white/82"
              >
                {tipo}
              </motion.div>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-white/[0.07]">
              <Network
                size={18}
                strokeWidth={1.55}
              />
            </div>
          </div>

          <div className="relative mt-10 flex items-center gap-4">
            <motion.div
              layout
              className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-white/[0.08]"
            >
              <DeviceIcon
                size={30}
                strokeWidth={1.45}
              />
            </motion.div>

            <div className="min-w-0">
              <motion.div
                key={`${values.marca}-${values.modelo}`}
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                className="truncate text-xl font-semibold tracking-[-0.03em]"
              >
                {[
                  values.marca || "Marca",
                  values.modelo,
                ]
                  .filter(Boolean)
                  .join(" ")}
              </motion.div>

              <motion.div
                key={values.numeroSerie}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-1 truncate text-xs text-white/42"
              >
                {values.numeroSerie ||
                  "Número de serie"}
              </motion.div>
            </div>
          </div>

          <div className="relative mt-10 grid grid-cols-2 gap-2.5">
            {[
              {
                icon: Building2,
                label: "Sucursal",
                value: sucursal,
              },
              {
                icon: MapPin,
                label: "Departamento",
                value: departamento,
              },
              {
                icon: Cpu,
                label: isTablet
                  ? "Dispositivo"
                  : "Hostname",
                value:
                  values.hostname ||
                  "Pendiente",
              },
              {
                icon: ShieldCheck,
                label: "Estado",
                value: estado,
              },
            ].map((item) => {
              const Glyph = item.icon;

              return (
                <motion.div
                  layout
                  key={item.label}
                  className="rounded-[15px] border border-white/[0.045] bg-white/[0.04] p-3"
                >
                  <Glyph
                    size={14}
                    strokeWidth={1.55}
                    className="text-white/35"
                  />

                  <div className="mt-4 text-[9px] text-white/30">
                    {item.label}
                  </div>

                  <div className="mt-1 truncate text-[11px] font-semibold text-white/68">
                    {item.value}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {!isTablet && (
            <div className="relative mt-8 border-t border-white/[0.06] pt-5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-white/30">
                  Dirección IP
                </span>

                <span className="font-medium text-white/60">
                  {values.direccionIp || "Opcional"}
                </span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
