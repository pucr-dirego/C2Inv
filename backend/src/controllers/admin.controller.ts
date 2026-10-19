import type { Request, Response } from "express";
import { z } from "zod";

import {
  AdminServiceError,
  approveUser,
  blockUser,
  getAdminCatalogs,
  listAdminBranches,
  listAdminUsers,
  revokeUserSessions,
  setBranchActiveState,
  unblockUser,
  updateUserAccess,
} from "../services/admin.service.js";
import type { AdminAuthUser } from "../types/admin.js";

const accessSchema = z
  .object({
    role: z.enum([
      "SUPERADMIN",
      "GERENTE",
      "USUARIO",
    ]),
    branchIds: z
      .array(z.string().uuid())
      .default([]),
  })
  .superRefine((value, ctx) => {
    const uniqueBranchIds =
      new Set(value.branchIds);

    if (
      value.role !== "SUPERADMIN" &&
      uniqueBranchIds.size !== 1
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["branchIds"],
        message:
          "Los roles GERENTE y USUARIO deben tener exactamente una sucursal.",
      });
    }
  });

function actor(res: Response) {
  return res.locals.authUser as AdminAuthUser;
}

/**
 * Express puede entregar un parámetro ausente o múltiple.
 * Validamos el identificador antes de enviarlo a los servicios.
 */
function getRouteId(req: Request, res: Response): string | null {
  const id = req.params.id;

  if (typeof id !== "string" || !id.trim()) {
    res.status(400).json({
      ok: false,
      code: "INVALID_ID",
      message: "El identificador del usuario no es válido.",
    });
    return null;
  }

  return id;
}

function handleError(
  error: unknown,
  res: Response,
) {
  if (!(error instanceof AdminServiceError)) {
    return false;
  }

  const status =
    error.code === "NOT_FOUND" ||
    error.code === "BRANCH_NOT_FOUND"
      ? 404
      : error.code === "SELF_BLOCK" ||
          error.code === "LAST_SUPERADMIN" ||
          error.code === "BRANCH_INACTIVE" ||
          error.code ===
            "INVALID_USER_STATE_TRANSITION"
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
  req: Request<{ id: string }>,
  res: Response,
) {
  const id = getRouteId(req, res);
  if (id === null) return;

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
      id,
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
  req: Request<{ id: string }>,
  res: Response,
) {
  const id = getRouteId(req, res);
  if (id === null) return;

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
      id,
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
  req: Request<{ id: string }>,
  res: Response,
) {
  const id = getRouteId(req, res);
  if (id === null) return;

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
      id,
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
  req: Request<{ id: string }>,
  res: Response,
) {
  const id = getRouteId(req, res);
  if (id === null) return;

  try {
    const user = await unblockUser(
      id,
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
  req: Request<{ id: string }>,
  res: Response,
) {
  const id = getRouteId(req, res);
  if (id === null) return;

  try {
    const result = await revokeUserSessions(
      id,
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


export async function branches(
  _req: Request,
  res: Response,
) {
  try {
    res.json({
      ok: true,
      branches:
        await listAdminBranches(),
    });
  } catch (error) {
    console.error(
      "Error cargando sucursales administrativas:",
      error,
    );

    res.status(500).json({
      ok: false,
      code: "ADMIN_BRANCHES_LOAD_FAILED",
      message:
        "No fue posible cargar las sucursales.",
    });
  }
}

export async function branchStatus(
  req: Request,
  res: Response,
) {
  const id = getRouteId(req, res);
  if (id === null) return;

  const validation = z
    .object({
      active: z.boolean(),
    })
    .safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      ok: false,
      code: "VALIDATION_ERROR",
      message:
        "El estado de la sucursal no es válido.",
    });
    return;
  }

  try {
    const branch =
      await setBranchActiveState(
        id,
        validation.data.active,
        actor(res),
        req.ip,
      );

    res.json({
      ok: true,
      message:
        validation.data.active
          ? "Sucursal reactivada."
          : "Sucursal desactivada.",
      branch,
    });
  } catch (error) {
    if (handleError(error, res)) return;

    console.error(
      "Error cambiando estado de sucursal:",
      error,
    );

    res.status(500).json({
      ok: false,
      code: "BRANCH_STATUS_FAILED",
      message:
        "No fue posible cambiar el estado de la sucursal.",
    });
  }
}
