import type { Request, Response } from "express";

import {
  AnalyticsServiceError,
  getAnalyticsGeography,
} from "../services/analytics.service.js";
import type { AnalyticsCountryCode } from "../types/analytics.js";
import type { InventoryAuthUser } from "../types/inventory.js";

function parseCountry(value: unknown): AnalyticsCountryCode | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase();

  if (normalized === "MX" || normalized === "CO") {
    return normalized;
  }

  return null;
}

export async function geography(
  req: Request,
  res: Response,
): Promise<void> {
  const country = parseCountry(req.query.country);

  if (!country) {
    res.status(400).json({
      ok: false,
      code: "INVALID_COUNTRY",
      message: "Selecciona un país válido: MX o CO.",
    });
    return;
  }

  const user = res.locals.authUser as
    | InventoryAuthUser
    | undefined;

  if (!user) {
    res.status(401).json({
      ok: false,
      code: "UNAUTHENTICATED",
      message: "Necesitas iniciar sesión.",
    });
    return;
  }

  try {
    const data = await getAnalyticsGeography(
      user,
      country,
    );

    res.status(200).json({
      ok: true,
      data,
    });
  } catch (error) {
    if (error instanceof AnalyticsServiceError) {
      const status = error.code === "FORBIDDEN" ? 403 : 400;

      res.status(status).json({
        ok: false,
        code: error.code,
        message: error.message,
      });
      return;
    }

    console.error("Error consultando analítica geográfica:", error);

    res.status(500).json({
      ok: false,
      code: "ANALYTICS_QUERY_FAILED",
      message: "No fue posible consultar la analítica geográfica.",
    });
  }
}
