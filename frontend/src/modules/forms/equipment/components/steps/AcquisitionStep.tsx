import {
  BadgeDollarSign,
  CalendarDays,
  Check,
  Clock3,
  FilePlus2,
  FileSearch,
  FileText,
  Landmark,
  Link2,
  PackageCheck,
  ReceiptText,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
} from "motion/react";
import type {
  Control,
  FieldErrors,
  UseFormRegister,
} from "react-hook-form";
import { Controller } from "react-hook-form";

import { ChoiceField } from "../../../../../components/ui/ChoiceField";
import { FormSection } from "../../../../../components/ui/FormSection";
import { InlineMessage } from "../../../../../components/ui/InlineMessage";
import { Input } from "../../../../../components/ui/Input";
import { TextArea } from "../../../../../components/ui/TextArea";
import { cn } from "../../../../../lib/cn";

import type {
  EquipmentCatalogs,
  EquipmentFormValues,
  InvoiceCaptureMode,
} from "../../types/equipment.types";

interface AcquisitionStepProps {
  register: UseFormRegister<EquipmentFormValues>;
  control: Control<EquipmentFormValues>;
  errors: FieldErrors<EquipmentFormValues>;
  catalogs: EquipmentCatalogs;
  incorporationCode?: string;
  invoiceMode: InvoiceCaptureMode;
}

const invoiceModes: Array<{
  value: InvoiceCaptureMode;
  title: string;
  description: string;
  icon: typeof FilePlus2;
}> = [
  {
    value: "REGISTRAR_AHORA",
    title: "Registrar ahora",
    description: "Captura una factura nueva y relaciónala con este equipo.",
    icon: FilePlus2,
  },
  {
    value: "ASOCIAR_EXISTENTE",
    title: "Asociar existente",
    description: "Usa una factura que ya fue capturada anteriormente.",
    icon: Link2,
  },
  {
    value: "COMPLETAR_DESPUES",
    title: "Completar después",
    description: "Registra el activo ahora y deja la factura pendiente.",
    icon: Clock3,
  },
];

export function AcquisitionStep({
  register,
  control,
  errors,
  catalogs,
  incorporationCode,
  invoiceMode,
}: AcquisitionStepProps) {
  const isNewPurchase =
    incorporationCode === "COMPRA_NUEVA";

  return (
    <FormSection
      title="Incorporación y adquisición"
      description="Primero define si se trata de una compra nueva o de un equipo que ya existía."
    >
      <div className="space-y-6">
        <Controller
          control={control}
          name="tipoIncorporacionId"
          render={({ field }) => (
            <div>
              <div className="mb-2 text-[13px] font-medium text-(--text-secondary)">
                ¿Cómo se incorpora este equipo?
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {catalogs.tiposIncorporacion.map((item) => {
                  const active =
                    field.value === item.id;

                  const ExistingIcon =
                    item.codigo === "COMPRA_NUEVA"
                      ? ReceiptText
                      : PackageCheck;

                  return (
                    <motion.button
                      key={item.id}
                      type="button"
                      whileTap={{ scale: 0.988 }}
                      onClick={() =>
                        field.onChange(item.id)
                      }
                      className={cn(
                        "relative overflow-hidden rounded-[20px] border p-4 text-left transition",
                        active
                          ? "border-blue-500/22 bg-blue-500/[0.065] shadow-[0_12px_35px_rgba(0,122,255,.09)]"
                          : "border-black/[0.065] bg-white/65 hover:bg-white/90",
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-black/[0.045]">
                          <ExistingIcon
                            size={18}
                            strokeWidth={1.65}
                          />
                        </div>

                        <div
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full transition",
                            active
                              ? "bg-(--accent) text-white"
                              : "bg-black/[0.05] text-transparent",
                          )}
                        >
                          <Check
                            size={13}
                            strokeWidth={2.2}
                          />
                        </div>
                      </div>

                      <div className="mt-5 text-sm font-semibold">
                        {item.nombre}
                      </div>

                      <div className="mt-1 text-xs leading-5 text-(--text-secondary)">
                        {item.descripcion}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {errors.tipoIncorporacionId?.message && (
                <p className="mt-2 text-xs text-(--danger)">
                  {errors.tipoIncorporacionId.message}
                </p>
              )}
            </div>
          )}
        />

        <AnimatePresence mode="wait">
          {isNewPurchase ? (
            <motion.div
              key="new-purchase"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{
                duration: 0.24,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="space-y-5"
            >
              <div>
                <div className="mb-2 text-[13px] font-medium text-(--text-secondary)">
                  ¿Qué hacemos con la factura?
                </div>

                <Controller
                  control={control}
                  name="facturaModo"
                  render={({ field }) => (
                    <div className="grid gap-2 lg:grid-cols-3">
                      {invoiceModes.map((mode) => {
                        const active =
                          field.value === mode.value;
                        const Glyph = mode.icon;

                        return (
                          <button
                            key={mode.value}
                            type="button"
                            onClick={() =>
                              field.onChange(
                                mode.value,
                              )
                            }
                            className={cn(
                              "rounded-[18px] border p-3.5 text-left transition",
                              active
                                ? "border-blue-500/20 bg-blue-500/[0.055]"
                                : "border-black/[0.06] bg-white/58 hover:bg-white/88",
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <Glyph
                                size={15}
                                strokeWidth={1.7}
                                className={
                                  active
                                    ? "text-blue-600"
                                    : "text-(--text-tertiary)"
                                }
                              />
                              <span className="text-xs font-semibold">
                                {mode.title}
                              </span>
                            </div>

                            <p className="mt-2 text-[11px] leading-4 text-(--text-tertiary)">
                              {mode.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
              </div>

              <AnimatePresence mode="wait">
                {invoiceMode ===
                  "REGISTRAR_AHORA" && (
                  <motion.div
                    key="register-invoice"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="rounded-[22px] border border-blue-500/[0.1] bg-blue-500/[0.03] p-5"
                  >
                    <div className="mb-5">
                      <div className="text-xs font-semibold">
                        Nueva factura
                      </div>
                      <div className="mt-1 text-xs leading-5 text-(--text-secondary)">
                        La factura queda independiente para que después pueda relacionarse con otros activos.
                      </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <Input
                        label="Número de factura"
                        placeholder="FAC-000123"
                        leftIcon={
                          <FileText size={16} />
                        }
                        error={
                          errors.factura
                            ?.numeroFactura?.message
                        }
                        {...register(
                          "factura.numeroFactura",
                        )}
                      />

                      <Input
                        label="Fecha de factura"
                        type="date"
                        leftIcon={
                          <CalendarDays size={16} />
                        }
                        {...register(
                          "factura.fechaFactura",
                        )}
                      />

                      <Input
                        label="Proveedor"
                        placeholder="Proveedor de la compra"
                        leftIcon={
                          <Landmark size={16} />
                        }
                        {...register(
                          "factura.proveedorNombre",
                        )}
                      />

                      <Input
                        label="Razón social receptora"
                        placeholder="Razón social facturada"
                        {...register(
                          "factura.razonSocial",
                        )}
                      />

                      <Controller
                        control={control}
                        name="factura.moneda"
                        render={({ field }) => (
                          <ChoiceField
                            label="Moneda"
                            value={
                              field.value ?? "MXN"
                            }
                            onChange={
                              field.onChange
                            }
                            options={[
                              {
                                value: "MXN",
                                label: "MXN",
                                description:
                                  "Peso mexicano",
                              },
                              {
                                value: "COP",
                                label: "COP",
                                description:
                                  "Peso colombiano",
                              },
                              {
                                value: "USD",
                                label: "USD",
                                description:
                                  "Dólar estadounidense",
                              },
                            ]}
                          />
                        )}
                      />

                      <Input
                        label="Total de factura"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        leftIcon={
                          <BadgeDollarSign
                            size={16}
                          />
                        }
                        {...register(
                          "factura.total",
                          {
                            setValueAs: (value) =>
                              value === ""
                                ? null
                                : Number(
                                    value,
                                  ),
                          },
                        )}
                      />

                      <div className="md:col-span-2">
                        <TextArea
                          label="Observaciones de factura"
                          placeholder="Notas fiscales, aclaraciones o información adicional..."
                          {...register(
                            "factura.observaciones",
                          )}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {invoiceMode ===
                  "ASOCIAR_EXISTENTE" && (
                  <motion.div
                    key="existing-invoice"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="rounded-[22px] border border-black/[0.06] bg-white/58 p-5"
                  >
                    {catalogs.facturasCompra.length ? (
                      <Controller
                        control={control}
                        name="facturaExistenteId"
                        render={({ field }) => (
                          <ChoiceField
                            label="Factura existente"
                            searchable
                            value={field.value}
                            onChange={
                              field.onChange
                            }
                            placeholder="Busca por factura o proveedor"
                            error={
                              errors
                                .facturaExistenteId
                                ?.message
                            }
                            options={catalogs.facturasCompra.map(
                              (invoice) => ({
                                value: invoice.id,
                                label:
                                  invoice.numeroFactura ??
                                  "Factura sin folio",
                                description:
                                  invoice.proveedorNombre ??
                                  invoice.razonSocial ??
                                  "Sin proveedor",
                                meta:
                                  invoice.fechaFactura ??
                                  undefined,
                              }),
                            )}
                          />
                        )}
                      />
                    ) : (
                      <InlineMessage
                        tone="warning"
                        title="Todavía no hay facturas"
                      >
                        Registra la primera factura con la opción “Registrar ahora” o deja la relación para después.
                      </InlineMessage>
                    )}
                  </motion.div>
                )}

                {invoiceMode ===
                  "COMPLETAR_DESPUES" && (
                  <motion.div
                    key="later"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <InlineMessage tone="info">
                      El equipo quedará identificado como compra nueva, pero sin factura asociada. Podremos completarla desde Inventory más adelante.
                    </InlineMessage>
                  </motion.div>
                )}
              </AnimatePresence>

              {invoiceMode !==
                "COMPLETAR_DESPUES" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid gap-5 md:grid-cols-2"
                >
                  <Input
                    label="Partida o renglón"
                    placeholder="Ej. 01, PART-003, Renglón 5"
                    leftIcon={
                      <FileSearch size={16} />
                    }
                    {...register(
                      "facturaPartida",
                    )}
                  />

                  <Input
                    label="Importe de este equipo"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    leftIcon={
                      <BadgeDollarSign
                        size={16}
                      />
                    }
                    {...register(
                      "importeAdquisicion",
                      {
                        setValueAs: (value) =>
                          value === ""
                            ? null
                            : Number(value),
                      },
                    )}
                  />
                </motion.div>
              )}
            </motion.div>
          ) : incorporationCode ===
            "EXISTENTE" ? (
            <motion.div
              key="existing-equipment"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <InlineMessage
                tone="success"
                title="Equipo existente"
              >
                No solicitaremos factura ni información de compra durante esta alta.
              </InlineMessage>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </FormSection>
  );
}
