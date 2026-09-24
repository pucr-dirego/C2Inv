import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedUser } from "../types/auth.js";

export function hasAnyRole(
  user: AuthenticatedUser,
  roles: string[],
): boolean {
  return roles.some((role) => user.roles.includes(role));
}

export function requireRoles(...roles: string[]) {
  return (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    const user = res.locals.authUser as
      | AuthenticatedUser
      | undefined;

    if (!user) {
      res.status(401).json({
        ok: false,
        code: "UNAUTHENTICATED",
        message: "Necesitas iniciar sesión.",
      });
      return;
    }

    if (!hasAnyRole(user, roles)) {
      res.status(403).json({
        ok: false,
        code: "FORBIDDEN",
        message: "No tienes permisos para realizar esta acción.",
      });
      return;
    }

    next();
  };
}

export function canAccessBranch(
  user: AuthenticatedUser,
  branchId: string,
): boolean {
  if (user.roles.includes("SUPERADMIN")) {
    return true;
  }

  return user.sucursales.some(
    (branch) => branch.id === branchId,
  );
}
