
import {
  CalendarDays,
  Clock3,
  FilePlus2,
  FileText,
  Landmark,
  Link2,
} from "lucide-react";

import { ChoiceField } from "../../../../components/ui/ChoiceField";
import { Input } from "../../../../components/ui/Input";
import { TextArea } from "../../../../components/ui/TextArea";
import { cn } from "../../../../lib/cn";

import type {
  EquipmentCatalogs,
  EquipmentFormValues,
  InvoiceCaptureMode,
} from "../types/equipment.types";

interface Props {
  values: EquipmentFormValues;
  catalogs: EquipmentCatalogs;
  hadInvoice: boolean;
  onChange: (next: EquipmentFormValues) => void;
}

const modes: Array<{
  value: InvoiceCaptureMode;
  label: string;
  icon: typeof FilePlus2;
}> = [
  { value: "ASOCIAR_EXISTENTE", label: "Asociar existente", icon: Link2 },
  { value: "REGISTRAR_AHORA", label: "Registrar nueva", icon: FilePlus2 },
  { value: "COMPLETAR_DESPUES", label: "Dejar pendiente", icon: Clock3 },
];

export function EquipmentInvoiceEditor({
  values,
  catalogs,
  hadInvoice,
  onChange,
}: Props) {
  function patch(partial: Partial<EquipmentFormValues>) {
    onChange({ ...values, ...partial });
  }

  function patchInvoice(
    partial: Partial<EquipmentFormValues["factura"]>,
  ) {
    onChange({
      ...values,
      factura: {
        ...values.factura,
        ...partial,
      },
    });
  }

  return (
    <div className="md:col-span-2 mt-1 rounded-[22px] border border-black/[0.055] bg-black/[0.018] p-5">
      <div>
        <div className="text-xs font-semibold">
          Factura de compra
        </div>
        <p className="mt-1 text-[11px] leading-5 text-(--text-secondary)">
          Puedes completar una factura pendiente, cambiar la relación o registrar una factura nueva sin salir del equipo.
        </p>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {modes.map((mode) => {
          const active = values.facturaModo === mode.value;
          const Icon = mode.icon;

          return (
            <button
              key={mode.value}
              type="button"
              onClick={() =>
                patch({
                  facturaModo: mode.value,
                  facturaExistenteId:
                    mode.value === "ASOCIAR_EXISTENTE"
                      ? values.facturaExistenteId
                      : "",
                })
              }
              className={cn(
                "rounded-[16px] border px-3 py-3 text-left transition",
                active
                  ? "border-blue-500/20 bg-blue-500/[0.055]"
                  : "border-black/[0.055] bg-white/60 hover:bg-white",
              )}
            >
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Icon size={14} />
                {mode.label}
              </div>
            </button>
          );
        })}
      </div>

      {values.facturaModo === "ASOCIAR_EXISTENTE" ? (
        <div className="mt-4">
          <ChoiceField
            label="Factura existente"
            searchable
            value={values.facturaExistenteId}
            onChange={(value) => patch({ facturaExistenteId: value })}
            placeholder="Selecciona una factura"
            options={catalogs.facturasCompra.map((invoice) => ({
              value: invoice.id,
              label: invoice.numeroFactura || "Factura sin número",
              description: [
                invoice.proveedorNombre,
                invoice.fechaFactura,
                invoice.total == null
                  ? null
                  : `${invoice.moneda} ${invoice.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
              ]
                .filter(Boolean)
                .join(" · "),
            }))}
          />
        </div>
      ) : null}

      {values.facturaModo === "REGISTRAR_AHORA" ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Input
            label="Número de factura"
            leftIcon={<FileText size={15} />}
            value={values.factura.numeroFactura ?? ""}
            onChange={(event) => patchInvoice({ numeroFactura: event.target.value })}
          />
          <Input
            label="Fecha de factura"
            type="date"
            leftIcon={<CalendarDays size={15} />}
            value={values.factura.fechaFactura ?? ""}
            onChange={(event) => patchInvoice({ fechaFactura: event.target.value })}
          />
          <Input
            label="Proveedor"
            leftIcon={<Landmark size={15} />}
            value={values.factura.proveedorNombre ?? ""}
            onChange={(event) => patchInvoice({ proveedorNombre: event.target.value })}
          />
          <Input
            label="Razón social"
            value={values.factura.razonSocial ?? ""}
            onChange={(event) => patchInvoice({ razonSocial: event.target.value })}
          />
          <Input
            label="Moneda"
            value={values.factura.moneda ?? "MXN"}
            onChange={(event) => patchInvoice({ moneda: event.target.value.toUpperCase() })}
          />
          <Input
            label="Total"
            type="number"
            value={values.factura.total ?? ""}
            onChange={(event) =>
              patchInvoice({
                total: event.target.value ? Number(event.target.value) : null,
              })
            }
          />
          <div className="md:col-span-2">
            <TextArea
              label="Observaciones de factura"
              value={values.factura.observaciones ?? ""}
              onChange={(event) => patchInvoice({ observaciones: event.target.value })}
            />
          </div>
        </div>
      ) : null}

      {values.facturaModo === "COMPLETAR_DESPUES" ? (
        <div
          className={cn(
            "mt-4 rounded-[16px] px-4 py-3 text-[11px] leading-5",
            hadInvoice
              ? "bg-amber-500/[0.08] text-amber-800"
              : "bg-black/[0.035] text-(--text-secondary)",
          )}
        >
          {hadInvoice
            ? "Este equipo ya tiene factura. Guardar con ‘Dejar pendiente’ desvinculará la factura del equipo, pero no eliminará la factura del catálogo."
            : "El equipo seguirá marcado como compra con factura pendiente y podrás completarla después desde esta misma pantalla."}
        </div>
      ) : null}
    </div>
  );
}
