import {
  Crosshair,
  Minus,
  Plus,
  RotateCcw,
} from "lucide-react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import {
  ZoomableGroup,
  useZoomPanContext,
} from "react-simple-maps/zoom";
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type WheelEvent,
} from "react";

import { useTheme } from "../../../theme/ThemeContext";
import {
  comparableRegionName,
  formatInteger,
  getGeographyName,
} from "../data/analytics.utils";
import type {
  AnalyticsBranch,
  AnalyticsCountryDefinition,
  AnalyticsMapMode,
} from "../types/analytics.types";

const MIN_ZOOM = 1;
const MAX_ZOOM = 8;
const CLUSTER_EXPAND_ZOOM = 4.2;
const BRANCH_FOCUS_ZOOM = 5.4;
const REGION_FOCUS_ZOOM = 2.6;

type MapView = {
  center: [number, number];
  zoom: number;
};

type MappableAnalyticsBranch = AnalyticsBranch & {
  coordinates: [number, number];
};

type BranchMarkerGroup = {
  key: string;
  coordinates: [number, number];
  branches: MappableAnalyticsBranch[];
};

function hasMapCoordinates(
  branch: AnalyticsBranch,
): branch is MappableAnalyticsBranch {
  return branch.coordinates !== null;
}

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

function displayCoordinates(
  branch: MappableAnalyticsBranch,
): [number, number] {
  const region = comparableRegionName(branch.region);
  const city = branch.city.trim().toLocaleLowerCase("es");

  // Ajuste exclusivamente visual. La coordenada almacenada en PostgreSQL
  // no se modifica; solo desplazamos el marcador para que Tampico se lea
  // claramente dentro de Tamaulipas en este mapa esquemático.
  if (region === comparableRegionName("Tamaulipas") && city === "tampico") {
    return [
      branch.coordinates[0] - 0.02,
      branch.coordinates[1] + 0.32,
    ];
  }

  return branch.coordinates;
}

function groupDisplayCoordinates(
  group: BranchMarkerGroup,
): [number, number] {
  const firstBranch = group.branches[0];
  return firstBranch ? displayCoordinates(firstBranch) : group.coordinates;
}

function regionStats(
  region: string,
  branches: AnalyticsBranch[],
) {
  const key = comparableRegionName(region);
  const matches = branches.filter(
    (branch) => comparableRegionName(branch.region) === key,
  );

  return {
    branches: matches.length,
    equipment: matches.reduce(
      (sum, branch) => sum + branch.equipment,
      0,
    ),
    attention: matches.reduce(
      (sum, branch) => sum + branch.attention,
      0,
    ),
  };
}

function markerGroups(branches: AnalyticsBranch[]) {
  const grouped = new Map<string, MappableAnalyticsBranch[]>();

  branches
    .filter(hasMapCoordinates)
    .forEach((branch) => {
    const key = branch.coordinates
      .map((value) => value.toFixed(5))
      .join("|");
    const current = grouped.get(key) ?? [];
    current.push(branch);
    grouped.set(key, current);
  });

  return [...grouped.entries()].map(([key, group]) => ({
    key,
    coordinates: group[0]?.coordinates ?? [0, 0],
    branches: [...group].sort((a, b) =>
      a.code.localeCompare(b.code, "es"),
    ),
  })) satisfies BranchMarkerGroup[];
}

function spiderOffset(
  index: number,
  total: number,
  coordinates: [number, number],
): [number, number] {
  if (total <= 1) {
    return [0, 0];
  }

  const [longitude, latitude] = coordinates;
  const radius = total >= 5 ? 40 : total >= 3 ? 35 : 30;

  const isGulfCoastCluster =
    longitude > -99 &&
    longitude < -96 &&
    latitude > 21 &&
    latitude < 24.5;

  const isPacificCoastCluster =
    longitude > -106 &&
    longitude < -103 &&
    latitude > 18 &&
    latitude < 20.5;

  let startAngle = -Math.PI / 2;
  let endAngle = startAngle + Math.PI * 2;

  if (isGulfCoastCluster) {
    startAngle = (Math.PI * 3) / 4;
    endAngle = (Math.PI * 5) / 4;
  } else if (isPacificCoastCluster) {
    startAngle = -Math.PI / 4;
    endAngle = Math.PI / 4;
  }

  const angle =
    total === 1
      ? (startAngle + endAngle) / 2
      : startAngle + ((endAngle - startAngle) * index) / Math.max(total - 1, 1);

  return [
    Math.cos(angle) * radius,
    Math.sin(angle) * radius,
  ];
}

function branchGroupCenter(branches: AnalyticsBranch[]) {
  const mappableBranches = branches.filter(hasMapCoordinates);

  if (mappableBranches.length === 0) {
    return null;
  }

  const longitude =
    mappableBranches.reduce(
      (sum, branch) => sum + branch.coordinates[0],
      0,
    ) / mappableBranches.length;
  const latitude =
    mappableBranches.reduce(
      (sum, branch) => sum + branch.coordinates[1],
      0,
    ) / mappableBranches.length;

  return [longitude, latitude] as [number, number];
}

function ScaleAwareMarkers({
  groups,
  selectedBranch,
  isDark,
  onSelectBranch,
  onExpandCluster,
}: {
  groups: BranchMarkerGroup[];
  selectedBranch: AnalyticsBranch | null;
  isDark: boolean;
  onSelectBranch: (branch: AnalyticsBranch) => void;
  onExpandCluster: (group: BranchMarkerGroup) => void;
}) {
  const { k } = useZoomPanContext();
  const [hoveredBranch, setHoveredBranch] = useState<string | null>(null);
  const [hoveredCluster, setHoveredCluster] = useState<string | null>(null);
  const inverseScale = 1 / Math.max(k, 0.0001);
  const showIndividualDuplicates = k >= CLUSTER_EXPAND_ZOOM;

  return (
    <>
      {groups.map((group) => {
        const isDuplicate = group.branches.length > 1;

        if (isDuplicate && !showIndividualDuplicates) {
          const clusterHovered = hoveredCluster === group.key;
          const equipment = group.branches.reduce(
            (sum, branch) => sum + branch.equipment,
            0,
          );
          const city = group.branches[0]?.city ?? "Ubicación compartida";

          return (
            <Marker
              key={`cluster-${group.key}`}
              coordinates={groupDisplayCoordinates(group)}
            >
              <g transform={`scale(${inverseScale})`}>
                <g
                  role="button"
                  tabIndex={0}
                  aria-label={`${group.branches.length} sucursales en ${city}. Acercar mapa.`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onExpandCluster(group);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onExpandCluster(group);
                    }
                  }}
                  onMouseEnter={() => setHoveredCluster(group.key)}
                  onMouseLeave={() => setHoveredCluster(null)}
                  className="analytics-marker cursor-pointer outline-none"
                >
                  {clusterHovered ? (
                    <circle
                      r={18}
                      fill={
                        isDark
                          ? "rgba(255,255,255,.11)"
                          : "rgba(29,29,31,.08)"
                      }
                      className="analytics-marker-halo"
                    />
                  ) : null}

                  <circle
                    r={10.8}
                    fill={isDark ? "rgba(28,28,30,.96)" : "rgba(255,255,255,.98)"}
                    stroke={isDark ? "rgba(255,255,255,.18)" : "rgba(29,29,31,.14)"}
                    strokeWidth={2.2}
                    className="analytics-marker-core"
                  />

                  <circle
                    r={4.2}
                    fill={isDark ? "#f5f5f7" : "#1d1d1f"}
                    opacity={0.12}
                    pointerEvents="none"
                  />

                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    y="0.4"
                    fontSize="8"
                    fontWeight="750"
                    fill={isDark ? "#f5f5f7" : "#1d1d1f"}
                    pointerEvents="none"
                  >
                    {group.branches.length}
                  </text>

                  {clusterHovered ? (
                    <g pointerEvents="none" transform="translate(15 -27)">
                      <rect
                        x="0"
                        y="0"
                        width={Math.max(106, city.length * 6.8 + 28)}
                        height="39"
                        rx="12"
                        fill={
                          isDark
                            ? "rgba(25,25,28,.95)"
                            : "rgba(255,255,255,.97)"
                        }
                        stroke={
                          isDark
                            ? "rgba(255,255,255,.12)"
                            : "rgba(0,0,0,.07)"
                        }
                      />
                      <text
                        x="12"
                        y="15"
                        fontSize="8.8"
                        fontWeight="700"
                        fill={isDark ? "#f5f5f7" : "#1d1d1f"}
                      >
                        {city}
                      </text>
                      <text
                        x="12"
                        y="29"
                        fontSize="7.2"
                        fill={isDark ? "#98989d" : "#8e8e93"}
                      >
                        {group.branches.length} sucursales · {equipment} equipos
                      </text>
                    </g>
                  ) : null}
                </g>
              </g>
            </Marker>
          );
        }

        return group.branches.map((branch, index) => {
          const active = selectedBranch?.id === branch.id;
          const hovered = hoveredBranch === branch.id;
          const [offsetX, offsetY] = isDuplicate
            ? spiderOffset(index, group.branches.length, group.coordinates)
            : [0, 0];
          const showCode = isDuplicate || k >= 6;
          const codeWidth = Math.max(24, branch.code.length * 6.1 + 14);

          return (
            <Marker
              key={branch.id}
              coordinates={displayCoordinates(branch)}
            >
              {isDuplicate ? (
                <line
                  x1={0}
                  y1={0}
                  x2={offsetX * inverseScale}
                  y2={offsetY * inverseScale}
                  stroke={
                    isDark
                      ? "rgba(255,255,255,.22)"
                      : "rgba(29,29,31,.18)"
                  }
                  strokeWidth={0.9 * inverseScale}
                  strokeDasharray={`${2.4 * inverseScale} ${2.4 * inverseScale}`}
                  pointerEvents="none"
                />
              ) : null}

              <g
                transform={`translate(${offsetX * inverseScale} ${offsetY * inverseScale})`}
              >
                <g transform={`scale(${inverseScale})`}>
                  <g
                    role="button"
                    tabIndex={0}
                    aria-label={`Seleccionar sucursal ${branch.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectBranch(branch);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onSelectBranch(branch);
                      }
                    }}
                    onMouseEnter={() => setHoveredBranch(branch.id)}
                    onMouseLeave={() => setHoveredBranch(null)}
                    className="analytics-marker cursor-pointer outline-none"
                  >
                    {(active || hovered) && (
                      <circle
                        r={active ? 13 : 11}
                        fill={
                          isDark
                            ? "rgba(10,132,255,.16)"
                            : "rgba(0,122,255,.14)"
                        }
                        className="analytics-marker-halo"
                      />
                    )}

                    <circle
                      r={active ? 6.5 : 5.4}
                      fill={
                        active
                          ? "#007aff"
                          : isDark
                            ? "#f5f5f7"
                            : "#1d1d1f"
                      }
                      stroke={isDark ? "#111114" : "#ffffff"}
                      strokeWidth={2.2}
                      className="analytics-marker-core"
                    />
                    <circle
                      r={1.65}
                      fill={
                        active
                          ? "#ffffff"
                          : isDark
                            ? "#111114"
                            : "#ffffff"
                      }
                      pointerEvents="none"
                    />

                    {showCode && !hovered && !active ? (
                      <g
                        pointerEvents="none"
                        transform="translate(9 -7)"
                        className="analytics-marker-code"
                      >
                        <rect
                          width={codeWidth}
                          height="15"
                          rx="7.5"
                          fill={
                            isDark
                              ? "rgba(25,25,28,.89)"
                              : "rgba(255,255,255,.91)"
                          }
                          stroke={
                            isDark
                              ? "rgba(255,255,255,.1)"
                              : "rgba(0,0,0,.06)"
                          }
                        />
                        <text
                          x={codeWidth / 2}
                          y="10.4"
                          textAnchor="middle"
                          fontSize="6.8"
                          fontWeight="700"
                          fill={isDark ? "#d1d1d6" : "#515154"}
                        >
                          {branch.code}
                        </text>
                      </g>
                    ) : null}

                    {(active || hovered) && (
                      <g
                        pointerEvents="none"
                        transform="translate(10 -22)"
                      >
                        <rect
                          x="0"
                          y="0"
                          width={Math.max(
                            72,
                            branch.name.length * 6.7 + 22,
                          )}
                          height="31"
                          rx="11"
                          fill={
                            isDark
                              ? "rgba(25,25,28,.94)"
                              : "rgba(255,255,255,.96)"
                          }
                          stroke={
                            isDark
                              ? "rgba(255,255,255,.12)"
                              : "rgba(0,0,0,.07)"
                          }
                        />
                        <text
                          x="11"
                          y="13"
                          fontSize="8.7"
                          fontWeight="650"
                          fill={isDark ? "#f5f5f7" : "#1d1d1f"}
                        >
                          {branch.name}
                        </text>
                        <text
                          x="11"
                          y="24"
                          fontSize="7.1"
                          fill={isDark ? "#98989d" : "#8e8e93"}
                        >
                          {branch.equipment} equipos
                        </text>
                      </g>
                    )}
                  </g>
                </g>
              </g>
            </Marker>
          );
        });
      })}
    </>
  );
}

export function GeoInventoryMap({
  country,
  branches,
  mode,
  selectedBranch,
  selectedRegion,
  onSelectBranch,
  onSelectRegion,
  onReset,
}: {
  country: AnalyticsCountryDefinition;
  branches: AnalyticsBranch[];
  mode: AnalyticsMapMode;
  selectedBranch: AnalyticsBranch | null;
  selectedRegion: string | null;
  onSelectBranch: (branch: AnalyticsBranch) => void;
  onSelectRegion: (region: string) => void;
  onReset: () => void;
}) {
  const { isDark } = useTheme();
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [view, setView] = useState<MapView>(() => ({
    center: country.projectionCenter,
    zoom: MIN_ZOOM,
  }));

  const mappableBranches = useMemo(
    () => branches.filter(hasMapCoordinates),
    [branches],
  );

  const groups = useMemo(
    () => markerGroups(mappableBranches),
    [mappableBranches],
  );

  const maxRegionEquipment = useMemo(() => {
    const values = branches.map((branch) =>
      regionStats(branch.region, branches).equipment,
    );

    return Math.max(1, ...values);
  }, [branches]);

  useEffect(() => {
    setView({
      center: country.projectionCenter,
      zoom: MIN_ZOOM,
    });
  }, [country.code, country.projectionCenter]);

  useEffect(() => {
    if (
      !selectedBranch ||
      !hasMapCoordinates(selectedBranch)
    ) {
      return;
    }

    setView((current) => ({
      center: displayCoordinates(selectedBranch),
      zoom: Math.max(current.zoom, BRANCH_FOCUS_ZOOM),
    }));
  }, [selectedBranch]);

  function fillForRegion(region: string) {
    const stats = regionStats(region, branches);
    const selected = selectedRegion
      ? comparableRegionName(selectedRegion) ===
        comparableRegionName(region)
      : false;

    if (selected) {
      return isDark ? "#238cff" : "#007aff";
    }

    if (mode === "inventory" && stats.equipment > 0) {
      const ratio = stats.equipment / maxRegionEquipment;
      const alpha = 0.16 + ratio * 0.62;

      return isDark
        ? `rgba(10,132,255,${alpha})`
        : `rgba(0,122,255,${alpha})`;
    }

    if (mode === "attention" && stats.equipment > 0) {
      const ratio = Math.min(
        1,
        stats.attention /
          Math.max(1, stats.equipment * 0.12),
      );
      const alpha = 0.14 + ratio * 0.58;

      return isDark
        ? `rgba(255,159,10,${alpha})`
        : `rgba(255,149,0,${alpha})`;
    }

    if (stats.branches > 0) {
      return isDark
        ? "rgba(255,255,255,.12)"
        : "rgba(29,29,31,.095)";
    }

    return isDark
      ? "rgba(255,255,255,.055)"
      : "rgba(29,29,31,.045)";
  }

  function selectRegion(region: string) {
    onSelectRegion(region);

    const regionKey = comparableRegionName(region);
    const matches = branches.filter(
      (branch) => comparableRegionName(branch.region) === regionKey,
    );
    const center = branchGroupCenter(matches);

    if (!center) {
      return;
    }

    setView((current) => ({
      center,
      zoom: Math.max(
        current.zoom,
        matches.length === 1 ? 4.2 : REGION_FOCUS_ZOOM,
      ),
    }));
  }

  function selectBranch(branch: AnalyticsBranch) {
    if (hasMapCoordinates(branch)) {
      setView((current) => ({
        center: displayCoordinates(branch),
        zoom: Math.max(current.zoom, BRANCH_FOCUS_ZOOM),
      }));
    }

    onSelectBranch(branch);
  }

  function expandCluster(group: BranchMarkerGroup) {
    const firstBranch = group.branches[0];

    if (firstBranch) {
      onSelectRegion(firstBranch.region);
    }

    setView({
      center: groupDisplayCoordinates(group),
      zoom: Math.max(view.zoom, BRANCH_FOCUS_ZOOM),
    });
  }

  function resetView() {
    setView({
      center: country.projectionCenter,
      zoom: MIN_ZOOM,
    });
    onReset();
  }

  function zoomBy(factor: number) {
    setView((current) => ({
      ...current,
      zoom: clampZoom(current.zoom * factor),
    }));
  }

  function handleWheelCapture(event: WheelEvent<HTMLDivElement>) {
    const scrollingIn = event.deltaY < 0;
    const atMax = view.zoom >= MAX_ZOOM - 0.01;
    const atMin = view.zoom <= MIN_ZOOM + 0.01;

    if ((atMax && scrollingIn) || (atMin && !scrollingIn)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  const focusRegion = hoveredRegion ?? selectedRegion;
  const focusStats = focusRegion
    ? regionStats(focusRegion, branches)
    : null;

  return (
    <div
      className="analytics-map-stage relative min-h-[540px] overflow-hidden rounded-[28px]"
      onWheelCapture={handleWheelCapture}
    >
      <div className="analytics-map-grid pointer-events-none absolute inset-0" />
      <div className="analytics-map-glow pointer-events-none absolute left-[22%] top-[14%] h-[320px] w-[320px] rounded-full" />

      <div className="absolute left-5 top-5 z-20 max-w-[62%] sm:left-6 sm:top-6 sm:max-w-[70%]">
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-(--text-tertiary)">
          {focusRegion ? country.regionLabel : "Cobertura nacional"}
        </div>
        <div className="mt-1 truncate text-[18px] font-semibold tracking-[-0.025em]">
          {focusRegion ?? country.name}
        </div>
        <div className="mt-1 text-[10px] text-(--text-tertiary)">
          {focusStats
            ? `${focusStats.branches} sucursal${focusStats.branches === 1 ? "" : "es"} · ${formatInteger(focusStats.equipment)} equipos`
            : mappableBranches.length === branches.length
              ? `${branches.length} sucursal${branches.length === 1 ? "" : "es"} georreferenciada${branches.length === 1 ? "" : "s"}`
              : `${branches.length} sucursal${branches.length === 1 ? "" : "es"} con ubicación · ${mappableBranches.length} en mapa`}
        </div>
      </div>

      <div className="absolute right-4 top-4 z-20 flex flex-col items-end gap-2 sm:right-5 sm:top-5">
        <div className="analytics-map-zoom-controls flex flex-col overflow-hidden rounded-[16px]">
          <button
            type="button"
            onClick={() => zoomBy(1.45)}
            disabled={view.zoom >= MAX_ZOOM - 0.01}
            className="analytics-map-control analytics-map-control-square flex h-10 w-10 items-center justify-center"
            aria-label="Acercar mapa"
            title="Acercar"
          >
            <Plus size={16} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            onClick={() => zoomBy(1 / 1.45)}
            disabled={view.zoom <= MIN_ZOOM + 0.01}
            className="analytics-map-control analytics-map-control-square flex h-10 w-10 items-center justify-center"
            aria-label="Alejar mapa"
            title="Alejar"
          >
            <Minus size={16} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            onClick={resetView}
            className="analytics-map-control analytics-map-control-square flex h-10 w-10 items-center justify-center"
            aria-label="Restablecer vista"
            title="Restablecer vista"
          >
            <RotateCcw size={15} strokeWidth={1.8} />
          </button>
        </div>

        <span className="analytics-map-control analytics-map-zoom-readout flex h-8 items-center rounded-full px-3 text-[9px] font-semibold tabular-nums text-(--text-secondary)">
          {view.zoom.toFixed(1)}×
        </span>
      </div>

      <div className="relative z-10 flex min-h-[540px] items-center justify-center px-1 pb-5 pt-20 sm:px-5 sm:pt-16">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            center: country.projectionCenter,
            scale: country.projectionScale,
          }}
          width={800}
          height={520}
          className="analytics-map-svg h-auto w-full"
          aria-label={`Mapa analítico de ${country.name}`}
        >
          <ZoomableGroup
            center={view.center}
            zoom={view.zoom}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            translateExtent={[
              [-120, -80],
              [920, 600],
            ]}
            onMoveEnd={({ coordinates, zoom }) => {
              const longitude = coordinates?.[0];
              const latitude = coordinates?.[1];

              if (
                longitude === undefined ||
                latitude === undefined
              ) {
                return;
              }

              setView((current) => ({
                center: [longitude, latitude],
                zoom:
                  typeof zoom === "number"
                    ? zoom
                    : current.zoom,
              }));
            }}
          >
            <Geographies geography={country.geographyUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const properties =
                    (geo.properties ?? {}) as Record<string, unknown>;
                  const regionName = getGeographyName(properties);
                  const selected = selectedRegion
                    ? comparableRegionName(selectedRegion) ===
                      comparableRegionName(regionName)
                    : false;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={() => setHoveredRegion(regionName)}
                      onMouseLeave={() => setHoveredRegion(null)}
                      onClick={() => selectRegion(regionName)}
                      stroke={
                        isDark
                          ? "rgba(255,255,255,.22)"
                          : "rgba(255,255,255,.95)"
                      }
                      strokeWidth={selected ? 1.2 : 0.65}
                      vectorEffect="non-scaling-stroke"
                      style={{
                        "--analytics-geo-fill":
                          fillForRegion(regionName),
                        "--analytics-geo-hover": selected
                          ? fillForRegion(regionName)
                          : isDark
                            ? "rgba(255,255,255,.18)"
                            : "rgba(29,29,31,.14)",
                      } as CSSProperties}
                      className="analytics-geography"
                      aria-label={regionName}
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" ||
                          event.key === " "
                        ) {
                          event.preventDefault();
                          selectRegion(regionName);
                        }
                      }}
                    />
                  );
                })
              }
            </Geographies>

            <ScaleAwareMarkers
              groups={groups}
              selectedBranch={selectedBranch}
              isDark={isDark}
              onSelectBranch={selectBranch}
              onExpandCluster={expandCluster}
            />
          </ZoomableGroup>
        </ComposableMap>
      </div>

      <div className="absolute bottom-4 left-5 z-20 flex max-w-[70%] items-center gap-2 text-[9px] text-(--text-tertiary) sm:bottom-5 sm:left-6">
        <Crosshair size={11} />
        <span>Rueda para zoom · arrastra para mover</span>
      </div>

      <div className="absolute bottom-4 right-5 z-20 hidden text-right text-[9px] text-(--text-tertiary) sm:bottom-5 sm:right-6 sm:block">
        Coordenadas aproximadas por ciudad
      </div>
    </div>
  );
}
