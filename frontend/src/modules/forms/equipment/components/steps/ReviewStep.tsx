import {
  Building2,
  Cpu,
  FileText,
  Laptop2,
  MapPin,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";

import { Surface } from "../../../../../components/ui/Surface";

import type {
  EquipmentCatalogs,
  EquipmentFormValues,
} from "../../types/equipment.types";

interface ReviewStepProps {
  values: EquipmentFormValues;
  catalogs: EquipmentCatalogs;
}

function resolveName(
  items: { id: string; nombre: string }[],
  id: string,
) {
  return (
    items.find((item) => item.id === id)?.nombre ??
    "—"
  );
}

export function ReviewStep({
  values,
  catalogs,
}: ReviewStepProps) {
  const type = catalogs.tiposEquipo.find(
    (item) => item.id === values.tipoEquipoId,
  );

  const incorporation =
    catalogs.tiposIncorporacion.find(
      (item) =>
        item.id === values.tipoIncorporacionId,
    );

  const selectedInvoice =
    catalogs.facturasCompra.find(
      (item) =>
        item.id === values.facturaExistenteId,
    );

  let acquisitionValue =
    incorporation?.nombre ?? "—";

  if (incorporation?.codigo === "COMPRA_NUEVA") {
    if (
      values.facturaModo === "REGISTRAR_AHORA"
    ) {
      acquisitionValue += ` · ${
        values.factura.numeroFactura ||
        "Factura nueva"
      }`;
    } else if (
      values.facturaModo ===
      "ASOCIAR_EXISTENTE"
    ) {
      acquisitionValue += ` · ${
        selectedInvoice?.numeroFactura ??
        "Factura existente"
      }`;
    } else {
      acquisitionValue +=
        " · Factura pendiente";
    }
  }

  const networkValue =
    type?.codigo === "TABLET"
      ? values.hostname ||
        values.sistemaOperativo ||
        "—"
      : [
          values.hostname || "—",
          values.direccionIp || "Sin IP",
        ].join(" · ");

  const rows = [
    {
      icon: Laptop2,
      label: "Equipo",
      value: [
        resolveName(
          catalogs.tiposEquipo,
          values.tipoEquipoId,
        ),
        values.marca,
        values.modelo,
      ]
        .filter(Boolean)
        .join(" · "),
    },
    {
      icon: FileText,
      label: "Serie",
      value: values.numeroSerie || "—",
    },
    {
      icon: Cpu,
      label:
        type?.codigo === "TABLET"
          ? "Datos técnicos"
          : "Red",
      value: networkValue,
    },
    {
      icon: Building2,
      label: "Asignación",
      value: `${resolveName(
        catalogs.sucursales,
        values.sucursalId,
      )} · ${resolveName(
        catalogs.departamentos,
        values.departamentoId,
      )}`,
    },
    {
      icon: MapPin,
      label: "Ubicación",
      value:
        values.ubicacionExacta || "—",
    },
    {
      icon: ShieldCheck,
      label: "Estado",
      value: `${resolveName(
        catalogs.estadosFuncionamiento,
        values.estadoFuncionamientoId,
      )} · ${resolveName(
        catalogs.condicionesFisicas,
        values.condicionFisicaId,
      )}`,
    },
    {
      icon: ReceiptText,
      label: "Adquisición",
      value: acquisitionValue,
    },
  ];

  return (
    <Surface
      material="floating"
      radius="large"
      className="p-6 sm:p-7"
    >
      <div className="mb-6">
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-(--text-tertiary)">
          Revisión final
        </div>

        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">
          Confirma antes de registrar.
        </h2>

        <p className="mt-2 max-w-xl text-sm leading-6 text-(--text-secondary)">
          Esta información será la base del activo dentro del inventario.
        </p>
      </div>

      <div>
        {rows.map((row) => {
          const Glyph = row.icon;

          return (
            <div
              key={row.label}
              className="equipment-review-row flex gap-4 py-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-black/[0.045] text-(--text-secondary)">
                <Glyph
                  size={17}
                  strokeWidth={1.7}
                />
              </div>

              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-(--text-tertiary)">
                  {row.label}
                </div>

                <div className="mt-1 text-sm font-semibold leading-6">
                  {row.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Surface>
  );
}
