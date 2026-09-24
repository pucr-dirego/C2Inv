import {
  ArrowRight,
  Laptop2,
  LogOut,
  Plus,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
} from "motion/react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import { NavHomeBrand } from "../../../components/navigation/NavHomeBrand";
import { Button } from "../../../components/ui/Button";
import { IconButton } from "../../../components/ui/IconButton";
import { LiquidGlass } from "../../../components/ui/LiquidGlass";
import { Spinner } from "../../../components/ui/Spinner";
import { useAutoRefresh } from "../../../hooks/useAutoRefresh";
import { useAuth } from "../../auth/context/AuthContext";
import { logout } from "../../auth/services/auth.service";
import { listMyEquipment } from "../../inventory/services/inventory.service";
import type { InventoryAsset } from "../../inventory/types/inventory.types";

export function BasicUserHomePage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const [items, setItems] =
    useState<InventoryAsset[]>([]);

  const [loading, setLoading] =
    useState(true);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
      }

      try {
        setItems(
          await listMyEquipment(),
        );
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useAutoRefresh(
    () => load(true),
    {
      intervalMs: 30_000,
    },
  );

  const firstName =
    user?.nombre?.split(" ")[0] ??
    "Usuario";

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

  return (
    <main className="relative min-h-screen overflow-hidden px-4 pb-14 pt-24 sm:px-6">
      <div className="pointer-events-none absolute left-[-14%] top-[-10%] h-[520px] w-[520px] rounded-full bg-blue-500/[0.065] blur-[105px]" />

      <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-5">
        <LiquidGlass
          strength="clear"
          className="mx-auto flex h-[62px] max-w-[1180px] items-center justify-between rounded-[22px] px-4"
        >
          <NavHomeBrand />

          <div className="flex items-center gap-2">
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
              Registrar equipo
            </Button>

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

      <div className="relative z-10 mx-auto max-w-[1180px]">
        <motion.section
          initial={{
            opacity: 0,
            y: 18,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.52,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="grid min-h-[520px] items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]"
        >
          <div>
            <h1 className="text-[clamp(3.7rem,7vw,7rem)] font-semibold leading-[0.9] tracking-[-0.075em]">
              Hola, {firstName}.
              <span className="block text-(--text-secondary)">
                Registra tu equipo.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-[17px] leading-7 text-(--text-secondary)">
              Captura la información del equipo de TI que utilizas.
            </p>

            <Button
              size="lg"
              className="mt-8 rounded-full px-6"
              rightIcon={
                <ArrowRight size={16} />
              }
              onClick={() =>
                navigate(
                  "/forms/equipos/nuevo",
                )
              }
            >
              Comenzar alta
            </Button>
          </div>

          <div className="relative mx-auto flex h-[360px] w-full max-w-[560px] items-center justify-center">
            <div className="absolute inset-[10%] rounded-full border border-black/[0.05]" />
            <div className="absolute inset-[25%] rounded-full border border-dashed border-blue-500/15" />

            <motion.div
              initial={{
                scale: 0.82,
                opacity: 0,
                rotate: -7,
              }}
              animate={{
                scale: 1,
                opacity: 1,
                rotate: 0,
              }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 25,
              }}
              className="flex h-36 w-36 items-center justify-center rounded-[40px] bg-black text-white shadow-[0_32px_80px_rgba(0,0,0,.22)]"
            >
              <Laptop2
                size={56}
                strokeWidth={1.3}
              />
            </motion.div>
          </div>
        </motion.section>

        <section className="mt-4 border-t border-black/[0.065] pt-10">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.04em]">
              Mis registros
            </h2>

            <p className="mt-1 text-sm text-(--text-secondary)">
              Equipos que has dado de alta en el sistema.
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-40 items-center justify-center">
              <Spinner className="text-(--accent)" />
            </div>
          ) : (
            <div className="mt-6 grid gap-3">
              <AnimatePresence initial={false}>
                {items.length === 0 ? (
                  <motion.div
                    initial={{
                      opacity: 0,
                    }}
                    animate={{
                      opacity: 1,
                    }}
                    className="rounded-[24px] border border-black/[0.055] bg-white/62 p-7 text-sm text-(--text-secondary) backdrop-blur-xl"
                  >
                    Aún no has registrado equipos.
                  </motion.div>
                ) : (
                  items.slice(0, 8).map(
                    (item) => (
                      <motion.button
                        layout
                        key={item.id}
                        type="button"
                        onClick={() =>
                          navigate(
                            `/inventory/equipment/${item.id}`,
                          )
                        }
                        className="group flex items-center justify-between gap-4 rounded-[22px] border border-black/[0.055] bg-white/70 p-4 text-left shadow-sm backdrop-blur-xl transition hover:bg-white/92"
                      >
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-black text-white">
                            <Laptop2 size={18} />
                          </div>

                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">
                              {item.numeroInventario}
                            </div>

                            <div className="mt-1 truncate text-xs text-(--text-secondary)">
                              {[item.tipoNombre, item.marca, item.modelo]
                                .filter(Boolean)
                                .join(" · ")}
                            </div>
                          </div>
                        </div>

                        <ArrowRight
                          size={16}
                          className="shrink-0 text-(--text-tertiary) transition group-hover:translate-x-0.5"
                        />
                      </motion.button>
                    ),
                  )
                )}
              </AnimatePresence>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
