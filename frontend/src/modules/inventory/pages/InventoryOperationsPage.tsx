import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { Spinner } from "../../../components/ui/Spinner";
import { useAutoRefresh } from "../../../hooks/useAutoRefresh";
import { useAuth } from "../../auth/context/AuthContext";
import { AttentionQueue } from "../components/AttentionQueue";
import { BranchScopePicker } from "../components/BranchScopePicker";
import { DistributionPanel } from "../components/DistributionPanel";
import { GlobalAssetSearch } from "../components/GlobalAssetSearch";
import { InventoryPulse } from "../components/InventoryPulse";
import { InventoryShell } from "../components/InventoryShell";
import { RecentActivity } from "../components/RecentActivity";
import { RecentAssets } from "../components/RecentAssets";
import { getInventoryOverview } from "../services/inventory.service";
import type {
  InventoryOverview,
} from "../types/inventory.types";

export function InventoryOperationsPage() {
  const { user } = useAuth();

  const [data, setData] =
    useState<InventoryOverview | null>(
      null,
    );

  const [branchId, setBranchId] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [
    searchOpen,
    setSearchOpen,
  ] = useState(false);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
      }

      try {
        setData(
          await getInventoryOverview(
            branchId || undefined,
          ),
        );

        setError(null);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No fue posible cargar el Centro de Operaciones.",
        );
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [branchId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    function openSearch() {
      setSearchOpen(true);
    }

    document.addEventListener(
      "inventory-open-search",
      openSearch,
    );

    function shortcut(
      event: KeyboardEvent,
    ) {
      if (
        (event.ctrlKey ||
          event.metaKey) &&
        event.key.toLowerCase() ===
          "k"
      ) {
        event.preventDefault();
        setSearchOpen(true);
      }
    }

    window.addEventListener(
      "keydown",
      shortcut,
    );

    return () => {
      document.removeEventListener(
        "inventory-open-search",
        openSearch,
      );

      window.removeEventListener(
        "keydown",
        shortcut,
      );
    };
  }, []);

  useAutoRefresh(
    () => load(true),
    {
      intervalMs: 30_000,
    },
  );

  const firstName =
    user?.nombre?.split(" ")[0] ??
    "Usuario";

  return (
    <InventoryShell>
      <main className="mx-auto max-w-[1280px] px-4 pb-16 sm:px-6">
        <section className="pb-8 pt-8 sm:pb-10 sm:pt-12">
          <h1 className="max-w-[1120px] text-[clamp(3.6rem,7.2vw,7.4rem)] font-semibold leading-[0.88] tracking-[-0.075em]">
            Hola, {firstName}.
            <span className="block text-(--text-secondary)">
              {data?.totals
                .requierenAtencion
                ? "Esto requiere tu atención."
                : "Todo bajo control."}
            </span>
          </h1>
        </section>

        <button
          type="button"
          onClick={() =>
            setSearchOpen(true)
          }
          className="flex h-[72px] w-full items-center justify-between rounded-[24px] border border-black/[0.05] bg-white/72 px-6 text-left shadow-[0_18px_50px_rgba(0,0,0,.06)] backdrop-blur-2xl transition hover:bg-white/92"
        >
          <span className="text-sm text-(--text-tertiary)">
            Buscar serie, hostname, activo, responsable...
          </span>

          <span className="rounded-[8px] bg-black/[0.045] px-2 py-1 text-[10px] font-semibold text-(--text-tertiary)">
            Ctrl K
          </span>
        </button>

        {loading && !data ? (
          <div className="flex min-h-[420px] items-center justify-center">
            <Spinner className="text-(--accent)" />
          </div>
        ) : error ? (
          <div className="mt-8 rounded-[24px] border border-red-500/10 bg-red-500/[0.05] p-5 text-sm text-red-700">
            {error}
          </div>
        ) : data ? (
          <>
            {data.branches.length >
              1 && (
              <div className="mt-5 flex justify-end">
                <BranchScopePicker
                  branches={
                    data.branches
                  }
                  value={branchId}
                  onChange={
                    setBranchId
                  }
                />
              </div>
            )}

            <div className="mt-8">
              <InventoryPulse
                data={data}
              />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <AttentionQueue
                data={data}
              />

              <RecentActivity
                data={data}
              />
            </div>

            <div className="mt-6">
              <DistributionPanel
                data={data}
              />
            </div>

            <div className="mt-6">
              <RecentAssets
                data={data}
              />
            </div>
          </>
        ) : null}

        <GlobalAssetSearch
          open={searchOpen}
          onClose={() =>
            setSearchOpen(false)
          }
        />
      </main>
    </InventoryShell>
  );
}
