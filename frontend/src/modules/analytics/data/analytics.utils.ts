import type {
  AnalyticsBranch,
  AnalyticsBreakdownItem,
  AnalyticsScopeSummary,
} from "../types/analytics.types";

export function normalizeGeoName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

const REGION_ALIASES: Record<string, string> = {
  ciudaddemexico: "distritofederal",
  bogotadc: "bogotadistritocapital",
  bogotadistritocapital: "bogotadistritocapital",
};

export function comparableRegionName(value: string) {
  const normalized = normalizeGeoName(value);
  return REGION_ALIASES[normalized] ?? normalized;
}

export function getGeographyName(
  properties: Record<string, unknown> | undefined,
) {
  if (!properties) {
    return "Región";
  }

  const possible = [
    properties.name,
    properties.NAME_1,
    properties.nom_agee,
    properties.dpto_nombre,
    properties.NOMBRE_DPT,
    properties.shapeName,
  ];

  const first = possible.find(
    (value) => typeof value === "string" && value.trim(),
  );

  return typeof first === "string"
    ? first
    : "Región";
}

export function sumBreakdowns(
  branches: AnalyticsBranch[],
  key: "typeDistribution" | "conditionDistribution",
): AnalyticsBreakdownItem[] {
  const map = new Map<string, number>();

  branches.forEach((branch) => {
    branch[key].forEach((item) => {
      map.set(
        item.label,
        (map.get(item.label) ?? 0) + item.value,
      );
    });
  });

  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function sumTrend(branches: AnalyticsBranch[]) {
  const length = Math.max(
    0,
    ...branches.map((branch) => branch.trend.length),
  );

  return Array.from({ length }, (_, index) =>
    branches.reduce(
      (total, branch) => total + (branch.trend[index] ?? 0),
      0,
    ),
  );
}

export function summarizeBranches(
  branches: AnalyticsBranch[],
  title: string,
  subtitle: string,
): AnalyticsScopeSummary {
  return {
    title,
    subtitle,
    equipment: branches.reduce(
      (sum, branch) => sum + branch.equipment,
      0,
    ),
    active: branches.reduce(
      (sum, branch) => sum + branch.active,
      0,
    ),
    operational: branches.reduce(
      (sum, branch) => sum + branch.operational,
      0,
    ),
    attention: branches.reduce(
      (sum, branch) => sum + branch.attention,
      0,
    ),
    offline: branches.reduce(
      (sum, branch) => sum + branch.offline,
      0,
    ),
    branches: branches.length,
    typeDistribution: sumBreakdowns(
      branches,
      "typeDistribution",
    ),
    conditionDistribution: sumBreakdowns(
      branches,
      "conditionDistribution",
    ),
    trend: sumTrend(branches),
  };
}

export function formatInteger(value: number) {
  return new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: 0,
  }).format(value);
}
