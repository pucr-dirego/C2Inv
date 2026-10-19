import {
  Activity,
  CircleAlert,
  Layers3,
  MapPinned,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { InventoryShell } from "../../inventory/components/InventoryShell";
import { AnalyticsKpis } from "../components/AnalyticsKpis";
import { AnalyticsSegmentedControl } from "../components/AnalyticsSegmentedControl";
import { BranchRanking } from "../components/BranchRanking";
import { ConditionDonut } from "../components/ConditionDonut";
import { DistributionBars } from "../components/DistributionBars";
import { GeoInventoryMap } from "../components/GeoInventoryMap";
import { ScopeDetailPanel } from "../components/ScopeDetailPanel";
import { TrendPanel } from "../components/TrendPanel";
import { ANALYTICS_COUNTRIES } from "../data/analytics.demo";
import {
  comparableRegionName,
  summarizeBranches,
} from "../data/analytics.utils";
import { getAnalyticsGeography } from "../services/analytics.service";
import type {
  AnalyticsBranch,
  AnalyticsCountryCode,
  AnalyticsMapMode,
} from "../types/analytics.types";

import "../analytics.css";

export function AnalyticsPage() {
  const [countryCode, setCountryCode] =
    useState<AnalyticsCountryCode>("MX");
  const [mapMode, setMapMode] =
    useState<AnalyticsMapMode>("branches");
  const [selectedBranch, setSelectedBranch] =
    useState<AnalyticsBranch | null>(null);
  const [selectedRegion, setSelectedRegion] =
    useState<string | null>(null);
  const [branches, setBranches] = useState<AnalyticsBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const country = ANALYTICS_COUNTRIES[countryCode];

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError(null);
    setSelectedBranch(null);
    setSelectedRegion(null);
    setBranches([]);

    void getAnalyticsGeography(
      countryCode,
      controller.signal,
    )
      .then((data) => {
        if (!controller.signal.aborted) {
          setBranches(data.branches);
        }
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        console.error(
          "Error cargando analítica geográfica:",
          requestError,
        );

        setError(
          requestError instanceof Error
            ? requestError.message
            : "No fue posible cargar la analítica geográfica.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [countryCode]);

  const countryBranches = branches;

  const regionBranches = useMemo(() => {
    if (!selectedRegion) {
      return countryBranches;
    }

    const regionKey = comparableRegionName(selectedRegion);

    return countryBranches.filter(
      (branch) =>
        comparableRegionName(branch.region) === regionKey,
    );
  }, [countryBranches, selectedRegion]);

  const countrySummary = useMemo(
    () =>
      summarizeBranches(
        countryBranches,
        country.name,
        `Vista nacional · ${countryBranches.length} sucursal${countryBranches.length === 1 ? "" : "es"} georreferenciada${countryBranches.length === 1 ? "" : "s"}`,
      ),
    [country.name, countryBranches],
  );

  const detailSummary = useMemo(() => {
    if (selectedBranch) {
      return summarizeBranches(
        [selectedBranch],
        selectedBranch.name,
        `${selectedBranch.city} · ${selectedBranch.region}`,
      );
    }

    if (selectedRegion) {
      return summarizeBranches(
        regionBranches,
        selectedRegion,
        `${country.name} · ${country.regionLabel}`,
      );
    }

    return countrySummary;
  }, [
    country.name,
    country.regionLabel,
    countrySummary,
    regionBranches,
    selectedBranch,
    selectedRegion,
  ]);

  function selectCountry(nextCountry: AnalyticsCountryCode) {
    setCountryCode(nextCountry);
  }

  function selectBranch(branch: AnalyticsBranch) {
    setSelectedBranch(branch);
    setSelectedRegion(branch.region);
  }

  function selectRegion(region: string) {
    setSelectedRegion(region);
    setSelectedBranch(null);
  }

  function resetMap() {
    setSelectedBranch(null);
    setSelectedRegion(null);
  }

  return (
    <InventoryShell>
      <main className="analytics-root mx-auto max-w-[1280px] px-4 pb-20 sm:px-6">
        <section className="pb-7 pt-6 sm:pb-9 sm:pt-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-(--text-tertiary)">
                <MapPinned size={13} strokeWidth={1.7} />
                Analítica geográfica
              </div>

              <h1 className="mt-4 max-w-[900px] text-[clamp(3.2rem,6.6vw,6.8rem)] font-semibold leading-[0.88] tracking-[-0.075em]">
                El inventario,
                <span className="block text-(--text-secondary)">
                  visto como territorio.
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-[14px] leading-6 text-(--text-secondary)">
                Explora el inventario real por país, región y sucursal. Las
                métricas de esta vista se consultan directamente desde
                PostgreSQL respetando el alcance de tu usuario.
              </p>
            </div>

            <AnalyticsSegmentedControl
              value={countryCode}
              onChange={selectCountry}
              layoutId="analytics-country-pill"
              className="w-full sm:w-auto"
              options={[
                { value: "MX", label: "México" },
                { value: "CO", label: "Colombia" },
              ]}
            />
          </div>
        </section>

        {error ? (
          <div className="mb-5 flex items-start gap-3 rounded-[20px] border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-(--text-secondary)">
            <CircleAlert className="mt-0.5 shrink-0" size={17} />
            <div>
              <div className="font-semibold text-(--text-primary)">
                No fue posible cargar la analítica
              </div>
              <div className="mt-1 text-xs">{error}</div>
            </div>
          </div>
        ) : null}

        <AnalyticsKpis summary={countrySummary} />

        <section className="mt-5">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-[11px] font-medium text-(--text-tertiary)">
              {mapMode === "branches" ? (
                <MapPinned size={13} />
              ) : mapMode === "inventory" ? (
                <Layers3 size={13} />
              ) : (
                <Activity size={13} />
              )}
              {loading
                ? "Consultando PostgreSQL..."
                : mapMode === "branches"
                  ? "Ubicaciones y selección"
                  : mapMode === "inventory"
                    ? "Intensidad por inventario"
                    : "Concentración de atención"}
            </div>

            <AnalyticsSegmentedControl
              value={mapMode}
              onChange={setMapMode}
              layoutId="analytics-map-mode-pill"
              className="w-full sm:w-auto"
              options={[
                { value: "branches", label: "Sucursales" },
                { value: "inventory", label: "Inventario" },
                { value: "attention", label: "Atención" },
              ]}
            />
          </div>

          <div
            className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(330px,.72fr)]"
            aria-busy={loading}
          >
            <GeoInventoryMap
              country={country}
              branches={countryBranches}
              mode={mapMode}
              selectedBranch={selectedBranch}
              selectedRegion={selectedRegion}
              onSelectBranch={selectBranch}
              onSelectRegion={selectRegion}
              onReset={resetMap}
            />

            <ScopeDetailPanel
              summary={detailSummary}
              selectedBranch={selectedBranch}
              regionBranches={regionBranches}
              onSelectBranch={selectBranch}
            />
          </div>
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-2">
          <DistributionBars
            title="Equipos por tipo"
            subtitle={detailSummary.title}
            items={detailSummary.typeDistribution}
          />

          <ConditionDonut
            items={detailSummary.conditionDistribution}
            total={detailSummary.active}
          />
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,.72fr)]">
          <TrendPanel values={detailSummary.trend} />
          <BranchRanking
            branches={countryBranches}
            onSelect={selectBranch}
          />
        </section>

        <footer className="mt-5 flex flex-col gap-2 px-1 text-[9px] leading-4 text-(--text-tertiary) sm:flex-row sm:items-center sm:justify-between">
          <span>
            Métricas: Inventarios TI · PostgreSQL. Ubicaciones aproximadas a nivel ciudad.
          </span>
          <a
            href={country.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-(--text-secondary)"
          >
            Fuente cartográfica: {country.sourceLabel}
          </a>
        </footer>
      </main>
    </InventoryShell>
  );
}
