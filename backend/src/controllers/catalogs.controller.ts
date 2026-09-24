import type { Request, Response } from "express";

import { getEquipmentCatalogs } from "../services/catalogs.service.js";
import type { EquipmentAuthUser } from "../types/equipment.js";

export async function equipmentCatalogs(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    const catalogs =
      await getEquipmentCatalogs(
        res.locals.authUser as EquipmentAuthUser,
      );

    res.status(200).json({
      ok: true,
      catalogs,
    });
  } catch (error) {
    console.error(
      "Error cargando catálogos de equipos:",
      error,
    );

    res.status(500).json({
      ok: false,
      code: "CATALOGS_LOAD_FAILED",
      message:
        "No fue posible cargar los catálogos del formulario.",
    });
  }
}
