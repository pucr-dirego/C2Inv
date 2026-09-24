import type { Request, Response } from "express";
import { z } from "zod";

import {
  AdminServiceError,
  approveUser,
  blockUser,
  getAdminCatalogs,
  listAdminUsers,
  revokeUserSessions,
  unblockUser,
  updateUserAccess,
} from "../services/admin.service.js";
import type { AdminAuthUser } from "../types/admin.js";

const accessSchema = z.object({
  role: z.enum([
    "SUPERADMIN",
    "GERENTE",
    "USUARIO",
  ]),
  branchIds: z.array(z.string().uuid()).default([]),
});

function actor(res: Response) {
  return res.locals.authUser as AdminAuthUser;
}

function handleError(
  error: unknown,
  res: Response,
) {
  if (!(error instanceof AdminServiceError)) {
    return false;
  }

  const status =
    error.code === "NOT_FOUND"
      ? 404
      : error.code === "SELF_BLOCK"
        ? 409
        : 400;

  res.status(status).json({
    ok: false,
    code: error.code,
    message: error.message,
  });

  return true;
}

export async function users(
  _req: Request,
  res: Response,
) {
  res.json({
    ok: true,
    users: await listAdminUsers(),
  });
}

export async function catalogs(
  _req: Request,
  res: Response,
) {
  res.json({
    ok: true,
    catalogs: await getAdminCatalogs(),
  });
}

export async function approve(
  req: Request,
  res: Response,
) {
  const validation = accessSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      ok: false,
      message: "Revisa el rol y las sucursales.",
    });
    return;
  }

  try {
    const user = await approveUser(
      req.params.id,
      validation.data,
      actor(res),
      req.ip,
    );

    res.json({
      ok: true,
      message: "Usuario aprobado correctamente.",
      user,
    });
  } catch (error) {
    if (handleError(error, res)) return;

    console.error(error);
    res.status(500).json({
      ok: false,
      message: "No fue posible aprobar al usuario.",
    });
  }
}

export async function access(
  req: Request,
  res: Response,
) {
  const validation = accessSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      ok: false,
      message: "Revisa el rol y las sucursales.",
    });
    return;
  }

  try {
    const user = await updateUserAccess(
      req.params.id,
      validation.data,
      actor(res),
      req.ip,
    );

    res.json({
      ok: true,
      message: "Acceso actualizado correctamente.",
      user,
    });
  } catch (error) {
    if (handleError(error, res)) return;

    console.error(error);
    res.status(500).json({
      ok: false,
      message: "No fue posible actualizar el acceso.",
    });
  }
}

export async function block(
  req: Request,
  res: Response,
) {
  const validation = z
    .object({
      reason: z.string().trim().min(3).max(1000),
    })
    .safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      ok: false,
      message: "Indica el motivo del bloqueo.",
    });
    return;
  }

  try {
    const user = await blockUser(
      req.params.id,
      validation.data.reason,
      actor(res),
      req.ip,
    );

    res.json({
      ok: true,
      message: "Usuario bloqueado.",
      user,
    });
  } catch (error) {
    if (handleError(error, res)) return;

    console.error(error);
    res.status(500).json({
      ok: false,
      message: "No fue posible bloquear al usuario.",
    });
  }
}

export async function unblock(
  req: Request,
  res: Response,
) {
  try {
    const user = await unblockUser(
      req.params.id,
      actor(res),
      req.ip,
    );

    res.json({
      ok: true,
      message: "Usuario desbloqueado.",
      user,
    });
  } catch (error) {
    if (handleError(error, res)) return;

    console.error(error);
    res.status(500).json({
      ok: false,
      message: "No fue posible desbloquear al usuario.",
    });
  }
}

export async function revokeSessions(
  req: Request,
  res: Response,
) {
  try {
    const result = await revokeUserSessions(
      req.params.id,
      actor(res),
      req.ip,
    );

    res.json({
      ok: true,
      message: "Sesiones revocadas.",
      ...result,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,
      message: "No fue posible revocar las sesiones.",
    });
  }
}
