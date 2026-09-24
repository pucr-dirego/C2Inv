import type { NextFunction, Request, Response } from "express";

import { getUserFromSession } from "../services/auth.service.js";

const COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME ??
  "inventarios_ti_session";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.cookies?.[COOKIE_NAME];

  if (!token || typeof token !== "string") {
    res.status(401).json({
      ok: false,
      code: "UNAUTHENTICATED",
      message: "Necesitas iniciar sesión para continuar.",
    });
    return;
  }

  try {
    const user = await getUserFromSession(token);

    if (!user) {
      res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });

      res.status(401).json({
        ok: false,
        code: "INVALID_SESSION",
        message: "La sesión no es válida o expiró.",
      });
      return;
    }

    res.locals.authUser = user;
    res.locals.sessionToken = token;
    next();
  } catch (error) {
    console.error("Error validando sesión:", error);

    res.status(500).json({
      ok: false,
      code: "AUTH_CHECK_FAILED",
      message: "No fue posible validar la sesión.",
    });
  }
}
