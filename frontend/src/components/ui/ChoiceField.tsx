import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  createPortal,
} from "react-dom";
import {
  Check,
  ChevronDown,
  Search,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
} from "motion/react";

import { cn } from "../../lib/cn";

export interface ChoiceOption {
  value: string;
  label: string;
  description?: string | null;
  meta?: string | null;
}

interface ChoiceFieldProps {
  label?: string;
  value: string;
  onChange: (
    value: string,
  ) => void;
  options: ChoiceOption[];
  placeholder?: string;
  error?: string;
  hint?: string;
  searchable?: boolean;
  disabled?: boolean;
}

interface FloatingPosition {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
  maxHeight: number;
}

export function ChoiceField({
  label,
  value,
  onChange,
  options,
  placeholder =
    "Selecciona una opción",
  error,
  hint,
  searchable = false,
  disabled = false,
}: ChoiceFieldProps) {
  const rootRef =
    useRef<HTMLDivElement>(null);

  const buttonRef =
    useRef<HTMLButtonElement>(null);

  const dropdownRef =
    useRef<HTMLDivElement>(null);

  const [open, setOpen] =
    useState(false);

  const [query, setQuery] =
    useState("");

  const [
    position,
    setPosition,
  ] =
    useState<FloatingPosition | null>(
      null,
    );

  const selected =
    options.find(
      (option) =>
        option.value === value,
    );

  const filtered = useMemo(() => {
    const normalized =
      query.trim().toLowerCase();

    if (!normalized) {
      return options;
    }

    return options.filter(
      (option) =>
        `${option.label} ${option.description ?? ""} ${option.meta ?? ""}`
          .toLowerCase()
          .includes(normalized),
    );
  }, [options, query]);

  const updatePosition =
    useCallback(() => {
      const button =
        buttonRef.current;

      if (!button) {
        return;
      }

      const rect =
        button.getBoundingClientRect();

      const viewportPadding =
        12;

      const availableBelow =
        window.innerHeight -
        rect.bottom -
        viewportPadding;

      const availableAbove =
        rect.top -
        viewportPadding;

      const preferAbove =
        availableBelow < 260 &&
        availableAbove >
          availableBelow;

      const width =
        Math.min(
          rect.width,
          window.innerWidth -
            viewportPadding * 2,
        );

      const left = Math.min(
        Math.max(
          viewportPadding,
          rect.left,
        ),
        window.innerWidth -
          width -
          viewportPadding,
      );

      if (preferAbove) {
        setPosition({
          left,
          width,
          bottom:
            window.innerHeight -
            rect.top +
            8,
          maxHeight:
            Math.max(
              160,
              Math.min(
                340,
                availableAbove - 8,
              ),
            ),
        });

        return;
      }

      setPosition({
        left,
        width,
        top:
          rect.bottom + 8,
        maxHeight:
          Math.max(
            160,
            Math.min(
              340,
              availableBelow - 8,
            ),
          ),
      });
    }, []);

  useEffect(() => {
    function onPointerDown(
      event: PointerEvent,
    ) {
      const target =
        event.target as Node;

      const insideTrigger =
        rootRef.current?.contains(
          target,
        );

      const insideDropdown =
        dropdownRef.current?.contains(
          target,
        );

      if (
        !insideTrigger &&
        !insideDropdown
      ) {
        setOpen(false);
      }
    }

    function onKeyDown(
      event: KeyboardEvent,
    ) {
      if (
        event.key === "Escape"
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "pointerdown",
      onPointerDown,
    );

    document.addEventListener(
      "keydown",
      onKeyDown,
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        onPointerDown,
      );

      document.removeEventListener(
        "keydown",
        onKeyDown,
      );
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setPosition(null);
      return;
    }

    updatePosition();

    const handleViewportChange =
      () => {
        updatePosition();
      };

    window.addEventListener(
      "resize",
      handleViewportChange,
    );

    window.addEventListener(
      "scroll",
      handleViewportChange,
      true,
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleViewportChange,
      );

      window.removeEventListener(
        "scroll",
        handleViewportChange,
        true,
      );
    };
  }, [
    open,
    updatePosition,
  ]);

  const dropdown =
    typeof document !==
      "undefined" &&
    open &&
    position
      ? createPortal(
          <AnimatePresence>
            <motion.div
              ref={dropdownRef}
              initial={{
                opacity: 0,
                y:
                  position.bottom
                    ? 6
                    : -6,
                scale: 0.985,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y:
                  position.bottom
                    ? 4
                    : -4,
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
              style={{
                position: "fixed",
                left:
                  position.left,
                width:
                  position.width,
                top:
                  position.top,
                bottom:
                  position.bottom,
                maxHeight:
                  position.maxHeight,
              }}
              className="z-[300] flex flex-col overflow-hidden rounded-[18px] border border-white/70 bg-white/92 p-1.5 shadow-[0_24px_70px_rgba(0,0,0,.18)] backdrop-blur-3xl backdrop-saturate-150"
            >
              {searchable && (
                <div className="mb-1 flex shrink-0 items-center gap-2 rounded-[13px] bg-black/[0.035] px-3">
                  <Search
                    size={14}
                    strokeWidth={1.7}
                    className="text-(--text-tertiary)"
                  />

                  <input
                    autoFocus
                    value={query}
                    onChange={(
                      event,
                    ) =>
                      setQuery(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Buscar..."
                    className="h-10 min-w-0 flex-1 bg-transparent text-sm text-(--text-primary) outline-none placeholder:text-black/30"
                  />
                </div>
              )}

              <div
                role="listbox"
                className="min-h-0 flex-1 overflow-y-auto p-0.5"
              >
                {filtered.length ? (
                  filtered.map(
                    (option) => {
                      const active =
                        option.value ===
                        value;

                      return (
                        <button
                          key={
                            option.value
                          }
                          type="button"
                          role="option"
                          aria-selected={
                            active
                          }
                          onClick={() => {
                            onChange(
                              option.value,
                            );
                            setOpen(
                              false,
                            );
                          }}
                          className={cn(
                            "group flex w-full items-center gap-3 rounded-[13px] px-3 py-2.5 text-left transition",
                            active
                              ? "bg-blue-500/[0.09]"
                              : "hover:bg-black/[0.045]",
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                              active
                                ? "bg-(--accent) text-white"
                                : "bg-black/[0.045] text-transparent",
                            )}
                          >
                            <Check
                              size={
                                12
                              }
                              strokeWidth={
                                2.1
                              }
                            />
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-(--text-primary)">
                              {
                                option.label
                              }
                            </span>

                            {(option.description ||
                              option.meta) && (
                              <span className="mt-0.5 block truncate text-[11px] text-(--text-tertiary)">
                                {option.description ??
                                  option.meta}
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    },
                  )
                ) : (
                  <div className="px-3 py-7 text-center text-xs text-(--text-tertiary)">
                    No encontramos coincidencias.
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>,
          document.body,
        )
      : null;

  return (
    <div
      ref={rootRef}
      className="relative w-full"
    >
      {label && (
        <div className="mb-2 text-[13px] font-medium tracking-[-0.01em] text-(--text-secondary)">
          {label}
        </div>
      )}

      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          if (disabled) {
            return;
          }

          setOpen(
            (current) =>
              !current,
          );
        }}
        className={cn(
          "flex min-h-12 w-full items-center justify-between gap-3 rounded-(--radius-control) border bg-white/72 px-3.5 text-left text-[15px] shadow-[0_1px_2px_rgba(0,0,0,.02)] backdrop-blur-xl transition-[border-color,box-shadow,background-color] duration-200 outline-none focus-visible:ring-4",
          error
            ? "border-red-500/35 focus-visible:ring-red-500/10"
            : open
              ? "border-blue-500/30 bg-white/94 ring-4 ring-(--accent-soft)"
              : "border-black/[0.07] hover:bg-white/90 focus-visible:ring-(--accent-soft)",
          disabled &&
            "cursor-not-allowed opacity-55",
        )}
      >
        <span
          className={cn(
            "min-w-0 truncate",
            selected
              ? "text-(--text-primary)"
              : "text-black/35",
          )}
        >
          {selected?.label ??
            placeholder}
        </span>

        <motion.span
          animate={{
            rotate: open
              ? 180
              : 0,
          }}
          transition={{
            duration: 0.18,
          }}
          className="shrink-0 text-(--text-tertiary)"
        >
          <ChevronDown
            size={16}
            strokeWidth={1.8}
          />
        </motion.span>
      </button>

      {dropdown}

      {(error || hint) && (
        <p
          className={cn(
            "mt-1.5 text-xs leading-5",
            error
              ? "text-(--danger)"
              : "text-(--text-tertiary)",
          )}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
