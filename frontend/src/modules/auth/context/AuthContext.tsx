import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getCurrentUser } from "../services/auth.service";
import type {
  AppRole,
  AuthUser,
} from "../types/auth.types";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  refreshSession: () => Promise<AuthUser | null>;
  hasRole: (...roles: AppRole[]) => boolean;
  isManager: boolean;
  isSuperAdmin: boolean;
  isBasicUser: boolean;
}

const AuthContext =
  createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [loading, setLoading] =
    useState(true);

  async function refreshSession() {
    try {
      const response =
        await getCurrentUser();

      setUser(response.user);
      return response.user;
    } catch {
      setUser(null);
      return null;
    }
  }

  useEffect(() => {
    let mounted = true;

    void getCurrentUser()
      .then((response) => {
        if (mounted) {
          setUser(response.user);
        }
      })
      .catch(() => {
        if (mounted) {
          setUser(null);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const roles = user?.roles ?? [];

    const hasRole = (
      ...wanted: AppRole[]
    ) =>
      wanted.some((role) =>
        roles.includes(role),
      );

    return {
      user,
      loading,
      setUser,
      refreshSession,
      hasRole,
      isManager:
        roles.includes("SUPERADMIN") ||
        roles.includes("GERENTE"),
      isSuperAdmin:
        roles.includes("SUPERADMIN"),
      isBasicUser:
        !roles.includes("SUPERADMIN") &&
        !roles.includes("GERENTE"),
    };
  }, [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth debe usarse dentro de AuthProvider.",
    );
  }

  return context;
}
