import type { Request, Response } from "express";
import { z } from "zod";

import {
  createEquipment,
  deactivateEquipment,
  EquipmentServiceError,
  getDeactivationReasons,
  reactivateEquipment,
  updateEquipment,
} from "../services/equipment.service.js";
import type { EquipmentAuthUser } from "../types/equipment.js";

const uuid = z.string().uuid();
const optionalUuid = z.union([uuid, z.literal("")]).optional();

const invoiceSchema = z
  .object({
    numeroFactura: z.string().trim().max(100).optional(),
    fechaFactura: z.string().trim().optional(),
    proveedorNombre: z.string().trim().max(200).optional(),
    razonSocial: z.string().trim().max(200).optional(),
    moneda: z.string().trim().max(3).optional(),
    total: z.number().nonnegative().nullable().optional(),
    observaciones: z.string().trim().max(2000).optional(),
  })
  .optional();

const equipmentSchema = z.object({
  tipoEquipoId: uuid,
  marca: z.string().trim().min(1).max(120),
  modelo: z.string().trim().max(150).optional(),
  numeroSerie: z.string().trim().min(1).max(150),
  hostname: z.string().trim().max(150).optional(),
  direccionIp: z.string().trim().max(64).optional(),
  sistemaOperativo: z.string().trim().max(150).optional(),
  anydesk: z.string().trim().max(100).optional(),
  estadoFuncionamientoId: uuid,
  condicionFisicaId: uuid,
  observaciones: z.string().trim().max(3000).optional(),
  sucursalId: uuid,
  departamentoId: uuid,
  responsable: z.string().trim().max(180).optional(),
  ubicacionExacta: z.string().trim().min(3).max(500),
  tipoIncorporacionId: uuid,
  facturaModo: z
    .enum([
      "REGISTRAR_AHORA",
      "ASOCIAR_EXISTENTE",
      "COMPLETAR_DESPUES",
    ])
    .optional(),
  facturaExistenteId: optionalUuid,
  facturaPartida: z.string().trim().max(100).optional(),
  importeAdquisicion: z.number().nonnegative().nullable().optional(),
  factura: invoiceSchema,
});

function authUser(res: Response): EquipmentAuthUser {
  return res.locals.authUser as EquipmentAuthUser;
}

function handleServiceError(
  error: unknown,
  res: Response,
) {
  if (!(error instanceof EquipmentServiceError)) {
    return false;
  }

  let status = 400;

  if (
    error.code === "FORBIDDEN" ||
    error.code === "BRANCH_NOT_ALLOWED"
  ) {
    status = 403;
  } else if (error.code === "NOT_FOUND") {
    status = 404;
  } else if (
    error.code === "SERIAL_IN_USE" ||
    error.code === "HOSTNAME_IN_USE" ||
    error.code === "VERSION_CONFLICT"
  ) {
    status = 409;
  }

  res.status(status).json({
    ok: false,
    code: error.code,
    message: error.message,
  });

  return true;
}

export async function create(
  req: Request,
  res: Response,
): Promise<void> {
  const validation = equipmentSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      ok: false,
      code: "VALIDATION_ERROR",
      message: "Revisa la información del equipo.",
      errors: validation.error.flatten(),
    });
    return;
  }

  try {
    const equipment = await createEquipment(
      validation.data,
      authUser(res),
    );

    res.status(201).json({
      ok: true,
      message: "Equipo registrado correctamente.",
      equipment,
    });
  } catch (error) {
    if (handleServiceError(error, res)) return;

    console.error("Error registrando equipo:", error);
    res.status(500).json({
      ok: false,
      code: "EQUIPMENT_CREATE_FAILED",
      message: "No fue posible registrar el equipo.",
    });
  }
}

export async function update(
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> {
  const validation = equipmentSchema
    .extend({
      version: z.number().int().positive(),
    })
    .safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      ok: false,
      code: "VALIDATION_ERROR",
      message: "Revisa la información del equipo.",
      errors: validation.error.flatten(),
    });
    return;
  }

  try {
    const result = await updateEquipment(
      req.params.id,
      validation.data,
      authUser(res),
    );

    res.json({
      ok: true,
      message: "Equipo actualizado correctamente.",
      equipment: result,
    });
  } catch (error) {
    if (handleServiceError(error, res)) return;

    console.error("Error actualizando equipo:", error);
    res.status(500).json({
      ok: false,
      code: "EQUIPMENT_UPDATE_FAILED",
      message: "No fue posible actualizar el equipo.",
    });
  }
}

export async function deactivate(
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> {
  const validation = z
    .object({
      motivoBajaId: uuid,
      detalle: z.string().trim().max(2000).optional(),
      version: z.number().int().positive(),
    })
    .safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      ok: false,
      code: "VALIDATION_ERROR",
      message: "Selecciona un motivo de baja.",
    });
    return;
  }

  try {
    const result = await deactivateEquipment(
      req.params.id,
      validation.data,
      authUser(res),
    );

    res.json({
      ok: true,
      message: "Equipo dado de baja correctamente.",
      equipment: result,
    });
  } catch (error) {
    if (handleServiceError(error, res)) return;

    console.error("Error dando de baja equipo:", error);
    res.status(500).json({
      ok: false,
      code: "EQUIPMENT_DEACTIVATE_FAILED",
      message: "No fue posible dar de baja el equipo.",
    });
  }
}

export async function reactivate(
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> {
  const validation = z
    .object({
      version: z.number().int().positive(),
    })
    .safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      ok: false,
      code: "VALIDATION_ERROR",
      message: "La versión del registro no es válida.",
    });
    return;
  }

  try {
    const result = await reactivateEquipment(
      req.params.id,
      validation.data.version,
      authUser(res),
    );

    res.json({
      ok: true,
      message: "Equipo reactivado correctamente.",
      equipment: result,
    });
  } catch (error) {
    if (handleServiceError(error, res)) return;

    console.error("Error reactivando equipo:", error);
    res.status(500).json({
      ok: false,
      code: "EQUIPMENT_REACTIVATE_FAILED",
      message: "No fue posible reactivar el equipo.",
    });
  }
}

export async function deactivationReasons(
  _req: Request,
  res: Response,
): Promise<void> {
  const items = await getDeactivationReasons();

  res.json({
    ok: true,
    items,
  });
}
