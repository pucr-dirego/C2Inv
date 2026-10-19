import { pool } from "../db/pool.js";

import type {
  ReportCatalogOption,
  ReportCountryCode,
  ReportCountryOption,
  ReportOptionsResult,
  ReportRegionSelection,
  ResolvedReportScope,
} from "../types/reports.js";

// ======================================================
// ETIQUETAS DE PAÍS
// ======================================================

const COUNTRY_LABELS: Record<
  ReportCountryCode,
  string
> = {
  MX: "México",
  CO: "Colombia",
};

// ======================================================
// TIPOS INTERNOS
// ======================================================

interface CatalogRow {
  id: string;
  code: string;
  name: string;
}

interface BrandRow {
  brand: string;
}

// ======================================================
// HELPERS
// ======================================================

function normalizeText(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("es-MX");
}

function uniqueRegions(
  scope: ResolvedReportScope,
): ReportRegionSelection[] {
  const seen = new Set<string>();
  const result: ReportRegionSelection[] = [];

  for (const branch of scope.branches) {
    if (
      !branch.countryCode ||
      !branch.region
    ) {
      continue;
    }

    const key =
      `${branch.countryCode}::${normalizeText(branch.region)}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);

    result.push({
      countryCode: branch.countryCode,
      name: branch.region,
    });
  }

  return result.sort((a, b) => {
    const countryCompare =
      a.countryCode.localeCompare(
        b.countryCode,
        "es",
      );

    if (countryCompare !== 0) {
      return countryCompare;
    }

    return a.name.localeCompare(
      b.name,
      "es",
    );
  });
}

function buildCountryOptions(
  scope: ResolvedReportScope,
): ReportCountryOption[] {
  const visibleCodes: ReportCountryCode[] =
    scope.accessMode === "superadmin"
      ? ["MX", "CO"]
      : Array.from(
          new Set(
            scope.branches
              .map(
                (branch) =>
                  branch.countryCode,
              )
              .filter(
                (
                  value,
                ): value is ReportCountryCode =>
                  value !== null,
              ),
          ),
        );

  return visibleCodes.map((code) => ({
    code,
    label: COUNTRY_LABELS[code],

    branchCount:
      scope.branches.filter(
        (branch) =>
          branch.countryCode === code,
      ).length,
  }));
}

function buildDefaultCountryCodes(
  scope: ResolvedReportScope,
): ReportCountryCode[] {
  if (scope.accessMode === "superadmin") {
    return ["MX", "CO"];
  }

  return Array.from(
    new Set(
      scope.branches
        .map(
          (branch) =>
            branch.countryCode,
        )
        .filter(
          (
            value,
          ): value is ReportCountryCode =>
            value !== null,
        ),
    ),
  );
}

function toCatalogOptions(
  rows: CatalogRow[],
): ReportCatalogOption[] {
  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
  }));
}

// ======================================================
// CONSULTAS DE CATÁLOGOS DISPONIBLES
// ======================================================

async function loadFilterOptions(
  branchIds: string[],
): Promise<ReportOptionsResult["filters"]> {
  if (branchIds.length === 0) {
    return {
      equipmentTypes: [],
      departments: [],
      operatingStatuses: [],
      physicalConditions: [],
      incorporationTypes: [],
      brands: [],
    };
  }

  const params = [branchIds];

  const [
    equipmentTypesResult,
    departmentsResult,
    operatingStatusesResult,
    physicalConditionsResult,
    incorporationTypesResult,
    brandsResult,
  ] = await Promise.all([
    pool.query<CatalogRow>(
      `
        SELECT DISTINCT
          te.id,
          te.codigo AS code,
          te.nombre AS name
        FROM equipos_ti e
        INNER JOIN tipos_equipo te
          ON te.id = e.tipo_equipo_id
        WHERE
          e.sucursal_id = ANY($1::uuid[])
        ORDER BY
          name,
          code
      `,
      params,
    ),

    pool.query<CatalogRow>(
      `
        SELECT DISTINCT
          d.id,
          d.codigo AS code,
          d.nombre AS name
        FROM equipos_ti e
        INNER JOIN departamentos d
          ON d.id = e.departamento_id
        WHERE
          e.sucursal_id = ANY($1::uuid[])
        ORDER BY
          name,
          code
      `,
      params,
    ),

    pool.query<CatalogRow>(
      `
        SELECT DISTINCT
          ef.id,
          ef.codigo AS code,
          ef.nombre AS name
        FROM equipos_ti e
        INNER JOIN estados_funcionamiento ef
          ON ef.id = e.estado_funcionamiento_id
        WHERE
          e.sucursal_id = ANY($1::uuid[])
        ORDER BY
          name,
          code
      `,
      params,
    ),

    pool.query<CatalogRow>(
      `
        SELECT DISTINCT
          cf.id,
          cf.codigo AS code,
          cf.nombre AS name
        FROM equipos_ti e
        INNER JOIN condiciones_fisicas cf
          ON cf.id = e.condicion_fisica_id
        WHERE
          e.sucursal_id = ANY($1::uuid[])
        ORDER BY
          name,
          code
      `,
      params,
    ),

    pool.query<CatalogRow>(
      `
        SELECT DISTINCT
          ti.id,
          ti.codigo AS code,
          ti.nombre AS name
        FROM equipos_ti e
        INNER JOIN tipos_incorporacion ti
          ON ti.id = e.tipo_incorporacion_id
        WHERE
          e.sucursal_id = ANY($1::uuid[])
        ORDER BY
          name,
          code
      `,
      params,
    ),

    pool.query<BrandRow>(
      `
        SELECT DISTINCT
          TRIM(e.marca) AS brand
        FROM equipos_ti e
        WHERE
          e.sucursal_id = ANY($1::uuid[])
          AND NULLIF(TRIM(e.marca), '') IS NOT NULL
        ORDER BY
          brand
      `,
      params,
    ),
  ]);

  return {
    equipmentTypes:
      toCatalogOptions(
        equipmentTypesResult.rows,
      ),

    departments:
      toCatalogOptions(
        departmentsResult.rows,
      ),

    operatingStatuses:
      toCatalogOptions(
        operatingStatusesResult.rows,
      ),

    physicalConditions:
      toCatalogOptions(
        physicalConditionsResult.rows,
      ),

    incorporationTypes:
      toCatalogOptions(
        incorporationTypesResult.rows,
      ),

    brands:
      brandsResult.rows.map(
        (row) => row.brand,
      ),
  };
}

// ======================================================
// API DEL SERVICIO
// ======================================================

/**
 * Construye todas las opciones dinámicas que necesita el
 * configurador de Reportes.
 *
 * Recibe un scope YA autorizado.
 *
 * Los catálogos se obtienen a partir de los datos realmente
 * presentes dentro de las sucursales permitidas para el usuario.
 * Esto evita llenar el frontend con opciones que no tienen
 * utilidad dentro de su alcance.
 */
export async function getReportOptionsFromScope(
  scope: ResolvedReportScope,
): Promise<ReportOptionsResult> {
  const filters =
    await loadFilterOptions(
      scope.branchIds,
    );

  return {
    scope: {
      accessMode:
        scope.accessMode,

      defaultCountryCodes:
        buildDefaultCountryCodes(
          scope,
        ),

      countries:
        buildCountryOptions(
          scope,
        ),

      regions:
        uniqueRegions(
          scope,
        ),

      branches:
        [...scope.branches].sort(
          (a, b) => {
            if (a.activa !== b.activa) {
              return a.activa ? -1 : 1;
            }

            return a.nombre.localeCompare(
              b.nombre,
              "es",
            );
          },
        ),

      warnings:
        scope.warnings,
    },

    filters,
  };
}


