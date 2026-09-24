import { z } from "zod";

function isIPv4(value: string): boolean {
  const normalized = value.trim();

  if (!normalized) {
    return true;
  }

  const blocks = normalized.split(".");

  if (blocks.length !== 4) {
    return false;
  }

  return blocks.every((block) => {
    if (!/^\d{1,3}$/.test(block)) {
      return false;
    }

    const number = Number(block);
    return number >= 0 && number <= 255;
  });
}

const nullableNonnegativeNumber = z
  .number()
  .nonnegative()
  .nullable();

export const equipmentSchema = z
  .object({
    tipoEquipoId: z
      .string()
      .uuid("Selecciona un tipo de equipo."),

    marca: z
      .string()
      .trim()
      .min(1, "La marca es obligatoria.")
      .max(120),

    modelo: z.string().trim().max(150),

    numeroSerie: z
      .string()
      .trim()
      .min(1, "El número de serie es obligatorio.")
      .max(150),

    hostname: z.string().trim().max(150),

    direccionIp: z
      .string()
      .trim()
      .max(64)
      .refine(
        isIPv4,
        "Ingresa una dirección IPv4 válida.",
      ),

    sistemaOperativo: z.string().trim().max(150),
    anydesk: z.string().trim().max(100),

    estadoFuncionamientoId: z
      .string()
      .uuid("Selecciona un estado de funcionamiento."),

    condicionFisicaId: z
      .string()
      .uuid("Selecciona una condición física."),

    observaciones: z.string().trim().max(3000),

    sucursalId: z
      .string()
      .uuid("Selecciona una sucursal."),

    departamentoId: z
      .string()
      .uuid("Selecciona un departamento."),

    responsable: z.string().trim().max(180),

    ubicacionExacta: z
      .string()
      .trim()
      .min(3, "Describe la ubicación exacta.")
      .max(500),

    tipoIncorporacionId: z
      .string()
      .uuid("Selecciona cómo se incorpora el equipo."),

    facturaModo: z.enum([
      "REGISTRAR_AHORA",
      "ASOCIAR_EXISTENTE",
      "COMPLETAR_DESPUES",
    ]),

    facturaExistenteId: z.string(),

    facturaPartida: z.string().trim().max(100),

    importeAdquisicion: nullableNonnegativeNumber,

    factura: z.object({
      numeroFactura: z.string().trim().max(100).optional(),
      fechaFactura: z.string().optional(),
      proveedorNombre: z.string().trim().max(200).optional(),
      razonSocial: z.string().trim().max(200).optional(),
      moneda: z.string().trim().max(3).optional(),
      total: nullableNonnegativeNumber.optional(),
      observaciones: z.string().trim().max(2000).optional(),
    }),
  })
  .superRefine((values, ctx) => {
    if (values.facturaModo === "REGISTRAR_AHORA") {
      if (!values.factura.numeroFactura?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["factura", "numeroFactura"],
          message: "Ingresa el número de factura.",
        });
      }
    }

    if (
      values.facturaModo === "ASOCIAR_EXISTENTE" &&
      !values.facturaExistenteId
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["facturaExistenteId"],
        message: "Selecciona una factura existente.",
      });
    }
  });

export type EquipmentSchemaValues =
  z.infer<typeof equipmentSchema>;
