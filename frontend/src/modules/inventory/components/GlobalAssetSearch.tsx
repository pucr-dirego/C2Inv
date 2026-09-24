import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AnimatePresence,
  motion,
} from "motion/react";
import {
  ArrowRight,
  Search,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { listInventory } from "../services/inventory.service";
import type { InventoryAsset } from "../types/inventory.types";
import { Spinner } from "../../../components/ui/Spinner";

export function GlobalAssetSearch({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const inputRef =
    useRef<HTMLInputElement>(null);

  const [query, setQuery] =
    useState("");

  const [items, setItems] =
    useState<InventoryAsset[]>([]);

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setItems([]);
      return;
    }

    const timer =
      window.setTimeout(
        () =>
          inputRef.current?.focus(),
        60,
      );

    return () =>
      window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (
      !open ||
      query.trim().length < 2
    ) {
      setItems([]);
      return;
    }

    let active = true;

    const timer =
      window.setTimeout(
        async () => {
          setLoading(true);

          try {
            const response =
              await listInventory({
                search:
                  query.trim(),
                limit: 8,
                active: "all",
              });

            if (active) {
              setItems(
                response.items,
              );
            }
          } catch {
            if (active) {
              setItems([]);
            }
          } finally {
            if (active) {
              setLoading(false);
            }
          }
        },
        220,
      );

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [open, query]);

  useEffect(() => {
    function escape(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    if (open) {
      window.addEventListener(
        "keydown",
        escape,
      );
    }

    return () =>
      window.removeEventListener(
        "keydown",
        escape,
      );
  }, [open, onClose]);

  function openAsset(id: string) {
    onClose();

    navigate(
      `/inventory/equipment/${id}`,
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[12vh]">
          <motion.button
            aria-label="Cerrar búsqueda"
            type="button"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-md"
          />

          <motion.div
            initial={{
              opacity: 0,
              y: -14,
              scale: 0.975,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -8,
              scale: 0.985,
            }}
            transition={{
              type: "spring",
              stiffness: 330,
              damping: 30,
            }}
            className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[28px] border border-white/65 bg-white/90 shadow-[0_40px_120px_rgba(0,0,0,.22)] backdrop-blur-3xl"
          >
            <div className="flex items-center gap-3 border-b border-black/[0.055] px-5">
              <Search
                size={19}
                strokeWidth={1.7}
                className="text-(--text-tertiary)"
              />

              <input
                ref={inputRef}
                value={query}
                onChange={(event) =>
                  setQuery(
                    event.target.value,
                  )
                }
                placeholder="Serie, hostname, activo, responsable..."
                className="h-16 min-w-0 flex-1 bg-transparent text-[17px] outline-none placeholder:text-black/30"
              />

              {loading ? (
                <Spinner
                  size="sm"
                  className="text-(--accent)"
                />
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.045] text-(--text-tertiary)"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="max-h-[54vh] overflow-y-auto p-2">
              {query.trim().length < 2 ? (
                <div className="px-4 py-10 text-center text-sm text-(--text-tertiary)">
                  Escribe al menos dos caracteres.
                </div>
              ) : !loading &&
                items.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-(--text-tertiary)">
                  No encontramos activos con esa búsqueda.
                </div>
              ) : (
                items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      openAsset(
                        item.id,
                      )
                    }
                    className="group flex w-full items-center gap-4 rounded-[18px] px-4 py-3.5 text-left transition hover:bg-black/[0.045]"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-black text-[10px] font-semibold text-white">
                      {item.tipoCodigo.slice(
                        0,
                        3,
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">
                        {
                          item.numeroInventario
                        }{" "}
                        · {item.marca}{" "}
                        {item.modelo ?? ""}
                      </div>

                      <div className="mt-1 truncate text-xs text-(--text-tertiary)">
                        {
                          item.sucursalNombre
                        }{" "}
                        ·{" "}
                        {
                          item.departamentoNombre
                        }{" "}
                        ·{" "}
                        {item.activo
                          ? item.estadoNombre
                          : "Baja"}
                      </div>
                    </div>

                    <ArrowRight
                      size={16}
                      className="text-black/20 transition group-hover:translate-x-0.5 group-hover:text-(--text-secondary)"
                    />
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
