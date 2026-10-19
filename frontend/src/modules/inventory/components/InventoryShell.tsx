import type { ReactNode } from "react";
import {
  LogOut,
  Plus,
  Search,
  Settings2,
} from "lucide-react";
import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import { NavHomeBrand } from "../../../components/navigation/NavHomeBrand";
import { Button } from "../../../components/ui/Button";
import { IconButton } from "../../../components/ui/IconButton";
import { LiquidGlass } from "../../../components/ui/LiquidGlass";
import { cn } from "../../../lib/cn";
import { useAuth } from "../../auth/context/AuthContext";
import { logout } from "../../auth/services/auth.service";

interface InventoryShellProps {
  children: ReactNode;
}

export function InventoryShell({
  children,
}: InventoryShellProps) {
  const navigate = useNavigate();

  const {
    user,
    setUser,
    isManager,
    isSuperAdmin,
  } = useAuth();

  async function handleLogout() {
    try {
      await logout();
    } finally {
      setUser(null);
      navigate(
        "/login",
        { replace: true },
      );
    }
  }

  const link = ({
    isActive,
  }: {
    isActive: boolean;
  }) =>
    cn(
      "rounded-full px-3.5 py-2 text-[13px] font-medium transition",
      isActive
        ? "bg-black text-white"
        : "text-(--text-secondary) hover:bg-black/[0.045] hover:text-(--text-primary)",
    );

  return (
    <div className="min-h-screen">
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
        <LiquidGlass
          strength="clear"
          className="mx-auto flex h-[62px] max-w-[1280px] items-center justify-between rounded-[22px] px-3.5 sm:px-4"
        >
          <NavHomeBrand />

          {isManager && (
            <nav className="hidden items-center gap-1 md:flex">
              <NavLink
                to="/operations"
                className={link}
              >
                Inicio
              </NavLink>

              <NavLink
                to="/inventory"
                className={link}
              >
                Inventario
              </NavLink>

              <NavLink
                to="/analytics"
                className={link}
              >
                Analítica
              </NavLink>

              <NavLink
                to="/reports"
                className={link}
              >
                Reportes
              </NavLink>

              {isSuperAdmin && (
                <NavLink
                  to="/admin"
                  className={link}
                >
                  Administración
                </NavLink>
              )}
            </nav>
          )}

          <div className="flex items-center gap-2">
            {isManager && (
              <IconButton
                label="Buscar"
                size="sm"
                className="hidden sm:inline-flex"
                onClick={() =>
                  document.dispatchEvent(
                    new CustomEvent(
                      "inventory-open-search",
                    ),
                  )
                }
              >
                <Search size={15} />
              </IconButton>
            )}

            <Button
              size="sm"
              className="rounded-full"
              leftIcon={
                <Plus size={15} />
              }
              onClick={() =>
                navigate(
                  "/forms/equipos/nuevo",
                )
              }
            >
              Nueva alta
            </Button>

            {isSuperAdmin && (
              <IconButton
                label="Administración"
                size="sm"
                className="md:hidden"
                onClick={() =>
                  navigate("/admin")
                }
              >
                <Settings2 size={15} />
              </IconButton>
            )}

            <div className="hidden max-w-32 text-right sm:block">
              <div className="truncate text-[11px] font-semibold">
                {user?.nombre}
              </div>

              <div className="truncate text-[9px] uppercase tracking-[0.09em] text-(--text-tertiary)">
                {user?.roles[0]}
              </div>
            </div>

            <IconButton
              label="Cerrar sesión"
              size="sm"
              onClick={handleLogout}
            >
              <LogOut size={15} />
            </IconButton>
          </div>
        </LiquidGlass>
      </header>

      <div className="pt-[88px]">
        {children}
      </div>
    </div>
  );
}
