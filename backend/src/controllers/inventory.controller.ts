import type { Request, Response } from "express";
import { z } from "zod";

import {
  getInventoryEquipment,
  getInventoryOverview,
  InventoryServiceError,
  listInventory,
  listMyEquipment,
} from "../services/inventory.service.js";
import type { InventoryAuthUser } from "../types/inventory.js";

function user(res: Response) {
  return res.locals.authUser as InventoryAuthUser;
}

function handleError(
  error: unknown,
  res: Response,
) {
  if (!(error instanceof InventoryServiceError)) {
    return false;
  }

  const status =
    error.code === "NOT_FOUND"
      ? 404
      : error.code === "FORBIDDEN" ||
          error.code === "BRANCH_NOT_ALLOWED"
        ? 403
        : 400;

  res.status(status).json({
    ok: false,
    code: error.code,
    message: error.message,
  });

  return true;
}

export async function overview(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const data = await getInventoryOverview(
      user(res),
      typeof req.query.branchId === "string"
        ? req.query.branchId
        : undefined,
    );

    res.json({ ok: true, data });
  } catch (error) {
    if (handleError(error, res)) return;

    console.error(error);

    res.status(500).json({
      ok: false,
      message: "No fue posible consultar el Centro de Operaciones.",
    });
  }
}

export async function list(
  req: Request,
  res: Response,
): Promise<void> {
  const query = z
    .object({
      search: z.string().optional(),
      branchId: z.string().uuid().optional(),
      typeCode: z.string().optional(),
      departmentId: z.string().uuid().optional(),
      statusCode: z.string().optional(),
      attention: z
        .enum([
          "no_operativo",
          "observaciones",
          "sin_responsable",
          "factura_pendiente",
          "dano_fisico",
        ])
        .optional(),
      active: z
        .enum(["active", "inactive", "all"])
        .optional(),
      limit: z.coerce.number().int().positive().optional(),
      offset: z.coerce.number().int().nonnegative().optional(),
    })
    .safeParse(req.query);

  if (!query.success) {
    res.status(400).json({
      ok: false,
      message: "Los filtros no son válidos.",
    });
    return;
  }

  try {
    const data = await listInventory(
      user(res),
      query.data,
    );

    res.json({ ok: true, data });
  } catch (error) {
    if (handleError(error, res)) return;

    console.error(error);

    res.status(500).json({
      ok: false,
      message: "No fue posible consultar el inventario.",
    });
  }
}

export async function mine(
  _req: Request,
  res: Response,
): Promise<void> {
  const items = await listMyEquipment(
    user(res),
  );

  res.json({
    ok: true,
    items,
  });
}

export async function detail(
  req: Request<{ id: string }>,
  res: Response,
): Promise<void> {
  try {
    const equipment = await getInventoryEquipment(
      user(res),
      req.params.id,
    );

    res.json({
      ok: true,
      equipment,
    });
  } catch (error) {
    if (handleError(error, res)) return;

    console.error(error);

    res.status(500).json({
      ok: false,
      message: "No fue posible consultar el equipo.",
    });
  }
}
