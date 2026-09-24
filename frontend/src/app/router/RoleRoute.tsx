import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../../modules/auth/context/AuthContext";
import type { AppRole } from "../../modules/auth/types/auth.types";

interface RoleRouteProps {
  roles: AppRole[];
  children: ReactNode;
}

export function RoleRoute({
  roles,
  children,
}: RoleRouteProps) {
  const { hasRole } = useAuth();

  if (!hasRole(...roles)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
