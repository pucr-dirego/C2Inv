import type { AnalyticsCountryDefinition } from "../types/analytics.types";

// Definición visual de los mapas.
// Las métricas y sucursales ya no viven aquí: ahora llegan desde PostgreSQL.
export const ANALYTICS_COUNTRIES: Record<
  "MX" | "CO",
  AnalyticsCountryDefinition
> = {
  MX: {
    code: "MX",
    name: "México",
    regionLabel: "estado",
    geographyUrl:
      "https://raw.githubusercontent.com/angelnmara/geojson/master/mexicoHigh.json",
    projectionCenter: [-102.2, 23.6],
    projectionScale: 1150,
    sourceLabel: "GeoJSON México (estados)",
    sourceUrl: "https://github.com/angelnmara/geojson",
  },
  CO: {
    code: "CO",
    name: "Colombia",
    regionLabel: "departamento",
    geographyUrl:
      "https://raw.githubusercontent.com/ytolosa/mapas-colombia/main/output/geojson/col_departamentos_real_nacional.geojson",
    projectionCenter: [-74.1, 4.6],
    projectionScale: 2050,
    sourceLabel: "MGN 2025 · DANE",
    sourceUrl: "https://github.com/ytolosa/mapas-colombia",
  },
};
