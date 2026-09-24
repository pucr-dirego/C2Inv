import type { Request, Response } from "express";
import { z } from "zod";

import {
  AuthServiceError,
  getUserFromSession,
  listRegistrationBranches,
  loginUser,
  registerUser,
  revokeSession,
} from "../services/auth.service.js";

const COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME ??
  "inventarios_ti_session";

const SESSION_TTL_HOURS =
  Number(process.env.SESSION_TTL_HOURS ?? 12);

const SESSION_MAX_AGE =
  SESSION_TTL_HOURS * 60 * 60 * 1000;

const registerSchema = z.object({
  nombre: z.string().trim().min(2).max(120),
  apellidoPaterno: z.string().trim().max(120).optional(),
  apellidoMaterno: z.string().trim().max(120).optional(),
  correo: z.string().trim().email().max(255),
  password: z.string().min(10).max(128),
  sucursalId: z.string().uuid(),
});

const loginSchema = z.object({
  correo: z.string().trim().email(),
  password: z.string().min(1),
});

function setSessionCookie(
  res: Response,
  token: string,
): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

function clearSessionCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function registrationBranches(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    const branches = await listRegistrationBranches();

    res.status(200).json({
      ok: true,
      branches,
    });
  } catch (error) {
    console.error("Error cargando sucursales de registro:", error);

    res.status(500).json({
      ok: false,
      code: "BRANCHES_LOAD_FAILED",
      message: "No fue posible cargar las sucursales.",
    });
  }
}

export async function register(
  req: Request,
  res: Response,
): Promise<void> {
  const validation = registerSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      ok: false,
      code: "VALIDATION_ERROR",
      message: "Revisa la información proporcionada.",
      errors: validation.error.flatten(),
    });
    return;
  }

  try {
    const user = await registerUser(validation.data);

    res.status(201).json({
      ok: true,
      message:
        "Cuenta registrada. Un administrador deberá aprobar el acceso.",
      user,
    });
  } catch (error) {
    if (error instanceof AuthServiceError) {
      const status =
        error.code === "EMAIL_IN_USE"
          ? 409
          : error.code === "BRANCH_NOT_FOUND"
            ? 400
            : 400;

      res.status(status).json({
        ok: false,
        code: error.code,
        message: error.message,
      });
      return;
    }

    console.error("Error durante registro:", error);

    res.status(500).json({
      ok: false,
      code: "INTERNAL_ERROR",
      message: "No fue posible crear la cuenta.",
    });
  }
}

export async function login(
  req: Request,
  res: Response,
): Promise<void> {
  const validation = loginSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      ok: false,
      code: "VALIDATION_ERROR",
      message: "Revisa las credenciales.",
    });
    return;
  }

  try {
    const result = await loginUser(
      validation.data,
      {
        ip: req.ip,
        userAgent: req.get("user-agent"),
      },
    );

    setSessionCookie(res, result.token);

    res.status(200).json({
      ok: true,
      message: "Sesión iniciada correctamente.",
      user: result.user,
      session: {
        expiresAt: result.expiresAt,
      },
    });
  } catch (error) {
    if (error instanceof AuthServiceError) {
      const status =
        error.code === "INVALID_CREDENTIALS"
          ? 401
          : 403;

      res.status(status).json({
        ok: false,
        code: error.code,
        message: error.message,
      });
      return;
    }

    console.error("Error durante login:", error);

    res.status(500).json({
      ok: false,
      code: "INTERNAL_ERROR",
      message: "No fue posible iniciar sesión.",
    });
  }
}

export async function me(
  req: Request,
  res: Response,
): Promise<void> {
  const token = req.cookies?.[COOKIE_NAME];

  if (!token || typeof token !== "string") {
    res.status(401).json({
      ok: false,
      code: "UNAUTHENTICATED",
      message: "No existe una sesión activa.",
    });
    return;
  }

  const user = await getUserFromSession(token);

  if (!user) {
    clearSessionCookie(res);

    res.status(401).json({
      ok: false,
      code: "INVALID_SESSION",
      message: "La sesión no es válida o expiró.",
    });
    return;
  }

  res.status(200).json({
    ok: true,
    user,
  });
}

export async function logout(
  req: Request,
  res: Response,
): Promise<void> {
  const token = req.cookies?.[COOKIE_NAME];

  if (token && typeof token === "string") {
    await revokeSession(token);
  }

  clearSessionCookie(res);

  res.status(200).json({
    ok: true,
    message: "Sesión cerrada correctamente.",
  });
}
