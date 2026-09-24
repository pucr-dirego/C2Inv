import {
  LogOut,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { NavHomeBrand } from "../../../components/navigation/NavHomeBrand";
import { LiquidGlass } from "../../../components/ui/LiquidGlass";
import { Button } from "../../../components/ui/Button";
import { IconButton } from "../../../components/ui/IconButton";
import { logout } from "../../auth/services/auth.service";
import { useAuth } from "../../auth/context/AuthContext";

export function LandingNav() {
  const navigate = useNavigate();

  const {
    user,
    setUser,
    isManager,
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

  function goToForms() {
    const section =
      document.getElementById("forms");

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    navigate("/forms/equipos/nuevo");
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <LiquidGlass
        strength="clear"
        className="mx-auto flex h-[62px] max-w-[1180px] items-center justify-between rounded-[22px] px-3.5 sm:px-4.5"
      >
        <NavHomeBrand />

        <nav className="hidden items-center gap-1 md:flex">
          <button
            type="button"
            onClick={goToForms}
            className="rounded-full px-4 py-2 text-[13px] font-medium text-(--text-secondary) transition hover:bg-black/[0.045] hover:text-(--text-primary)"
          >
            Formularios
          </button>

          {isManager && (
            <button
              type="button"
              onClick={() =>
                navigate("/operations")
              }
              className="rounded-full px-4 py-2 text-[13px] font-medium text-(--text-secondary) transition hover:bg-black/[0.045] hover:text-(--text-primary)"
            >
              Plataforma
            </button>
          )}

          <Button
            size="sm"
            onClick={() =>
              navigate(
                "/forms/equipos/nuevo",
              )
            }
            leftIcon={
              <Plus size={15} />
            }
            className="ml-1 rounded-full"
          >
            Nueva alta
          </Button>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden max-w-40 leading-tight sm:block">
            <div className="truncate text-xs font-semibold">
              {user?.nombre}
            </div>

            <div className="truncate text-[10px] text-(--text-tertiary)">
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
  );
}
