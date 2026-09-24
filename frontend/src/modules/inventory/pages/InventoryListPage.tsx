import {
  ChevronRight,
  Search,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { Input } from "../../../components/ui/Input";
import { Spinner } from "../../../components/ui/Spinner";
import { useAutoRefresh } from "../../../hooks/useAutoRefresh";
import {
  getEquipmentCatalogs,
} from "../../forms/equipment/services/equipment.service";
import type {
  EquipmentCatalogs,
} from "../../forms/equipment/types/equipment.types";
import { InventoryFilterBar } from "../components/InventoryFilterBar";
import { InventoryShell } from "../components/InventoryShell";
import { listInventory } from "../services/inventory.service";
import type {
  AttentionKey,
  InventoryAsset,
  InventoryFilters,
} from "../types/inventory.types";

type ActiveFilter =
  | "active"
  | "inactive"
  | "all";

const validAttention = new Set<
  AttentionKey
>([
  "no_operativo",
  "observaciones",
  "sin_responsable",
  "factura_pendiente",
  "dano_fisico",
]);

function parseActive(
  value: string | null,
): ActiveFilter {
  if (
    value === "inactive" ||
    value === "all"
  ) {
    return value;
  }

  return "active";
}

function parseAttention(
  value: string | null,
): AttentionKey | "" {
  if (
    value &&
    validAttention.has(
      value as AttentionKey,
    )
  ) {
    return value as AttentionKey;
  }

  return "";
}

export function InventoryListPage() {
  const navigate = useNavigate();

  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const [items, setItems] =
    useState<InventoryAsset[]>([]);

  const [total, setTotal] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [catalogs, setCatalogs] =
    useState<EquipmentCatalogs | null>(
      null,
    );

  const [active, setActive] =
    useState<ActiveFilter>(
      parseActive(
        searchParams.get("active"),
      ),
    );

  const [branchId, setBranchId] =
    useState(
      searchParams.get("branchId") ??
        "",
    );

  const [typeCode, setTypeCode] =
    useState(
      searchParams.get("typeCode") ??
        "",
    );

  const [
    departmentId,
    setDepartmentId,
  ] = useState(
    searchParams.get(
      "departmentId",
    ) ?? "",
  );

  const [
    statusCode,
    setStatusCode,
  ] = useState(
    searchParams.get("statusCode") ??
      "",
  );

  const [attention, setAttention] =
    useState<AttentionKey | "">(
      parseAttention(
        searchParams.get(
          "attention",
        ),
      ),
    );

  useEffect(() => {
    let mounted = true;

    void getEquipmentCatalogs()
      .then((data) => {
        if (mounted) {
          setCatalogs(data);
        }
      })
      .catch(() => {
        if (mounted) {
          setCatalogs(null);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setActive(
      parseActive(
        searchParams.get("active"),
      ),
    );

    setBranchId(
      searchParams.get("branchId") ??
        "",
    );

    setTypeCode(
      searchParams.get("typeCode") ??
        "",
    );

    setDepartmentId(
      searchParams.get(
        "departmentId",
      ) ?? "",
    );

    setStatusCode(
      searchParams.get(
        "statusCode",
      ) ?? "",
    );

    setAttention(
      parseAttention(
        searchParams.get(
          "attention",
        ),
      ),
    );
  }, [searchParams]);

  function updateUrl(
    key: string,
    value: string,
  ) {
    const next =
      new URLSearchParams(
        searchParams,
      );

    if (
      !value ||
      (key === "active" &&
        value === "active")
    ) {
      next.delete(key);
    } else {
      next.set(key, value);
    }

    setSearchParams(
      next,
      { replace: true },
    );
  }

  const load = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
      }

      try {
        const filters: InventoryFilters =
          {
            search:
              search.trim() ||
              undefined,
            active,
            branchId:
              branchId ||
              undefined,
            typeCode:
              typeCode ||
              undefined,
            departmentId:
              departmentId ||
              undefined,
            statusCode:
              statusCode ||
              undefined,
            attention:
              attention ||
              undefined,
            limit: 100,
            offset: 0,
          };

        const response =
          await listInventory(
            filters,
          );

        setItems(response.items);
        setTotal(response.total);
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [
      search,
      active,
      branchId,
      typeCode,
      departmentId,
      statusCode,
      attention,
    ],
  );

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          void load();
        },
        180,
      );

    return () =>
      window.clearTimeout(timer);
  }, [load]);

  useAutoRefresh(
    () => load(true),
    {
      intervalMs: 30_000,
    },
  );

  function changeActive(
    value: ActiveFilter,
  ) {
    setActive(value);
    updateUrl(
      "active",
      value,
    );
  }

  function clearFilters() {
    setSearch("");
    setActive("active");
    setBranchId("");
    setTypeCode("");
    setDepartmentId("");
    setStatusCode("");
    setAttention("");

    setSearchParams(
      new URLSearchParams(),
      { replace: true },
    );
  }

  return (
    <InventoryShell>
      <main className="mx-auto max-w-[1280px] px-4 pb-16 sm:px-6">
        <section className="pt-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-[clamp(3.4rem,6.5vw,6rem)] font-semibold leading-[0.92] tracking-[-0.07em]">
                Inventario.
              </h1>

              <p className="mt-3 text-sm text-(--text-secondary)">
                {total} registros coinciden con la vista actual.
              </p>
            </div>

            <div className="flex rounded-full bg-black/[0.045] p-1">
              {[
                [
                  "active",
                  "Activos",
                ],
                [
                  "inactive",
                  "Bajas",
                ],
                [
                  "all",
                  "Todos",
                ],
              ].map(
                ([
                  value,
                  label,
                ]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      changeActive(
                        value as ActiveFilter,
                      )
                    }
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                      active === value
                        ? "bg-white text-black shadow-sm"
                        : "text-(--text-tertiary)"
                    }`}
                  >
                    {label}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="mt-8 max-w-2xl">
            <Input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Buscar por inventario, serie, hostname, marca, modelo o responsable"
              leftIcon={
                <Search size={17} />
              }
            />
          </div>

          <InventoryFilterBar
            catalogs={catalogs}
            branchId={branchId}
            typeCode={typeCode}
            departmentId={
              departmentId
            }
            statusCode={
              statusCode
            }
            attention={attention}
            onBranchChange={(
              value,
            ) => {
              setBranchId(value);
              updateUrl(
                "branchId",
                value,
              );
            }}
            onTypeChange={(
              value,
            ) => {
              setTypeCode(value);
              updateUrl(
                "typeCode",
                value,
              );
            }}
            onDepartmentChange={(
              value,
            ) => {
              setDepartmentId(
                value,
              );
              updateUrl(
                "departmentId",
                value,
              );
            }}
            onStatusChange={(
              value,
            ) => {
              setStatusCode(value);
              updateUrl(
                "statusCode",
                value,
              );
            }}
            onAttentionChange={(
              value,
            ) => {
              setAttention(value);
              updateUrl(
                "attention",
                value,
              );
            }}
            onClear={clearFilters}
          />
        </section>

        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center">
            <Spinner className="text-(--accent)" />
          </div>
        ) : (
          <section className="mt-8 overflow-hidden rounded-[28px] border border-black/[0.055] bg-white/72 shadow-sm backdrop-blur-xl">
            {items.length === 0 ? (
              <div className="p-10 text-center text-sm text-(--text-secondary)">
                No hay equipos para mostrar con esos filtros.
              </div>
            ) : (
              items.map(
                (item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      navigate(
                        `/inventory/equipment/${item.id}`,
                      )
                    }
                    className="group grid w-full grid-cols-[1fr_auto] items-center gap-4 border-b border-black/[0.055] p-5 text-left outline-none transition last:border-0 hover:bg-black/[0.032] focus-visible:bg-blue-500/[0.055] sm:grid-cols-[1.4fr_1fr_1fr_auto_auto]"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">
                        {
                          item.numeroInventario
                        }
                      </div>

                      <div className="mt-1 truncate text-xs text-(--text-secondary)">
                        {[
                          item.tipoNombre,
                          item.marca,
                          item.modelo,
                        ]
                          .filter(
                            Boolean,
                          )
                          .join(" · ")}
                      </div>
                    </div>

                    <div className="hidden text-xs text-(--text-secondary) sm:block">
                      {
                        item.sucursalNombre
                      }

                      <div className="mt-1 text-[10px] text-(--text-tertiary)">
                        {
                          item.departamentoNombre
                        }
                      </div>
                    </div>

                    <div className="hidden text-xs sm:block">
                      {item.activo
                        ? item.estadoNombre
                        : "Baja"}

                      <div className="mt-1 text-[10px] text-(--text-tertiary)">
                        {
                          item.condicionNombre
                        }
                      </div>
                    </div>

                    <div className="text-xs font-medium text-(--text-tertiary)">
                      {String(
                        index + 1,
                      ).padStart(
                        2,
                        "0",
                      )}
                    </div>

                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.035] text-black/30 transition group-hover:translate-x-0.5 group-hover:bg-black/[0.06] group-hover:text-(--text-secondary)">
                      <ChevronRight
                        size={15}
                        strokeWidth={1.8}
                      />
                    </span>
                  </button>
                ),
              )
            )}
          </section>
        )}
      </main>
    </InventoryShell>
  );
}
