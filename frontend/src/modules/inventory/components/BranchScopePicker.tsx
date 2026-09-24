import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Building2,
  Check,
  ChevronDown,
  Search,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
} from "motion/react";

import type {
  InventoryBranch,
} from "../types/inventory.types";

interface BranchScopePickerProps {
  branches: InventoryBranch[];
  value: string;
  onChange: (value: string) => void;
}

export function BranchScopePicker({
  branches,
  value,
  onChange,
}: BranchScopePickerProps) {
  const rootRef =
    useRef<HTMLDivElement>(null);

  const [open, setOpen] =
    useState(false);

  const [query, setQuery] =
    useState("");

  const selected =
    branches.find(
      (branch) =>
        branch.id === value,
    ) ?? null;

  const filtered = useMemo(() => {
    const normalized =
      query.trim().toLowerCase();

    if (!normalized) {
      return branches;
    }

    return branches.filter(
      (branch) =>
        `${branch.nombre} ${branch.codigo}`
          .toLowerCase()
          .includes(normalized),
    );
  }, [branches, query]);

  useEffect(() => {
    function handlePointerDown(
      event: PointerEvent,
    ) {
      if (
        rootRef.current &&
        !rootRef.current.contains(
          event.target as Node,
        )
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener(
      "pointerdown",
      handlePointerDown,
    );

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown,
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  function choose(next: string) {
    onChange(next);
    setOpen(false);
  }

  return (
    <div
      ref={rootRef}
      className="relative"
    >
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() =>
          setOpen(
            (current) => !current,
          )
        }
        className="group flex h-11 items-center gap-2 rounded-full border border-black/[0.06] bg-white/78 pl-2 pr-3 shadow-sm backdrop-blur-2xl transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/10"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/[0.045] text-(--text-secondary)">
          <Building2
            size={14}
            strokeWidth={1.7}
          />
        </span>

        <span className="max-w-[180px] truncate text-xs font-semibold">
          {selected?.nombre ??
            "Todas las sucursales"}
        </span>

        <motion.span
          animate={{
            rotate: open ? 180 : 0,
          }}
          transition={{
            duration: 0.16,
          }}
          className="ml-0.5 text-(--text-tertiary)"
        >
          <ChevronDown
            size={14}
            strokeWidth={1.8}
          />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{
              opacity: 0,
              y: -8,
              scale: 0.985,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -6,
              scale: 0.99,
            }}
            transition={{
              duration: 0.18,
              ease: [
                0.22,
                1,
                0.36,
                1,
              ],
            }}
            className="absolute right-0 top-[calc(100%+8px)] z-[80] w-[300px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[20px] border border-white/75 bg-white/92 p-1.5 shadow-[0_28px_75px_rgba(0,0,0,.16)] backdrop-blur-3xl backdrop-saturate-150"
          >
            {branches.length > 8 && (
              <div className="mb-1 flex items-center gap-2 rounded-[14px] bg-black/[0.035] px-3">
                <Search
                  size={14}
                  strokeWidth={1.7}
                  className="text-(--text-tertiary)"
                />

                <input
                  autoFocus
                  value={query}
                  onChange={(event) =>
                    setQuery(
                      event.target.value,
                    )
                  }
                  placeholder="Buscar sucursal"
                  className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-black/30"
                />
              </div>
            )}

            <div
              role="listbox"
              className="max-h-72 overflow-y-auto p-0.5"
            >
              <button
                type="button"
                role="option"
                aria-selected={!value}
                onClick={() =>
                  choose("")
                }
                className={`flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left transition ${
                  !value
                    ? "bg-blue-500/[0.09]"
                    : "hover:bg-black/[0.045]"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                    !value
                      ? "bg-blue-500 text-white"
                      : "bg-black/[0.045] text-transparent"
                  }`}
                >
                  <Check
                    size={12}
                    strokeWidth={2.2}
                  />
                </span>

                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    Todas las sucursales
                  </span>

                  <span className="mt-0.5 block text-[10px] text-(--text-tertiary)">
                    Vista consolidada
                  </span>
                </span>
              </button>

              {filtered.map(
                (branch) => {
                  const active =
                    branch.id === value;

                  return (
                    <button
                      key={branch.id}
                      type="button"
                      role="option"
                      aria-selected={
                        active
                      }
                      onClick={() =>
                        choose(
                          branch.id,
                        )
                      }
                      className={`flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left transition ${
                        active
                          ? "bg-blue-500/[0.09]"
                          : "hover:bg-black/[0.045]"
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                          active
                            ? "bg-blue-500 text-white"
                            : "bg-black/[0.045] text-transparent"
                        }`}
                      >
                        <Check
                          size={12}
                          strokeWidth={2.2}
                        />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {
                            branch.nombre
                          }
                        </span>

                        <span className="mt-0.5 block text-[10px] uppercase tracking-[0.08em] text-(--text-tertiary)">
                          {
                            branch.codigo
                          }
                        </span>
                      </span>
                    </button>
                  );
                },
              )}

              {filtered.length ===
                0 && (
                <div className="px-3 py-8 text-center text-xs text-(--text-tertiary)">
                  No encontramos esa sucursal.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
