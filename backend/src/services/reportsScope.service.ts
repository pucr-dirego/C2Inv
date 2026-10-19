import { pool } from "../db/pool.js";

import type {
  ReportCountryCode,
  ReportRegionSelection,
  ReportScopeBranch,
  ReportScopeInput,
  ReportsAuthUser,
  ResolvedReportScope,
} from "../types/reports.js";

// ======================================================
// ERRORES
// ======================================================

export type ReportsScopeServiceErrorCode =
  | "FORBIDDEN"
  | "MANAGER_BRANCH_CONFIGURATION"
  | "BRANCH_NOT_FOUND"
  | "BRANCH_NOT_ALLOWED"
  | "INVALID_SCOPE"
  | "UNSUPPORTED_BRANCH_COUNTRY";

export class ReportsScopeServiceError extends Error {
  readonly code: ReportsScopeServiceErrorCode;

  constructor(
    code: ReportsScopeServiceErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ReportsScopeServiceError";
    this.code = code;
  }
}

// ======================================================
// TIPOS INTERNOS
// ======================================================

interface BranchRow {
  id: string;
  codigo: string;
  nombre: string;
  activa: boolean;
  countryCode: string | null;
  region: string | null;
}

const SUPPORTED_COUNTRIES = new Set<ReportCountryCode>([
  "MX",
  "CO",
]);

// ======================================================
// HELPERS DE ROLES
// ======================================================

function isSuperAdmin(user: ReportsAuthUser): boolean {
  return user.roles.includes("SUPERADMIN");
}

function isManager(user: ReportsAuthUser): boolean {
  return user.roles.includes("GERENTE");
}

// ======================================================
// HELPERS DE NORMALIZACIÓN
// ======================================================

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

function normalizeText(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("es-MX");
}

function isSupportedCountryCode(
  value: string | null,
): value is ReportCountryCode {
  return (
    value !== null &&
    SUPPORTED_COUNTRIES.has(value as ReportCountryCode)
  );
}

function hasCompleteReportGeography(
  row: BranchRow,
): boolean {
  return (
    isSupportedCountryCode(row.countryCode) &&
    typeof row.region === "string" &&
    row.region.trim().length > 0
  );
}

function isKnownUnsupportedCountry(row: BranchRow): boolean {
  return (
    row.countryCode !== null &&
    !isSupportedCountryCode(row.countryCode)
  );
}

function toScopeBranch(row: BranchRow): ReportScopeBranch {
  return {
    id: row.id,
    codigo: row.codigo,
    nombre: row.nombre,
    activa: row.activa,
    countryCode: isSupportedCountryCode(row.countryCode)
      ? row.countryCode
      : null,
    region: row.region?.trim() || null,
    hasCompleteGeography: hasCompleteReportGeography(row),
  };
}

function regionKey(
  region: ReportRegionSelection,
): string {
  return `${region.countryCode}::${normalizeText(region.name)}`;
}

function branchRegionKey(row: BranchRow): string | null {
  if (
    !isSupportedCountryCode(row.countryCode) ||
    !row.region?.trim()
  ) {
    return null;
  }

  return `${row.countryCode}::${normalizeText(row.region)}`;
}

function allSupportedCountriesSelected(
  countries: ReportCountryCode[],
): boolean {
  const unique = new Set(countries);

  return (
    unique.size === SUPPORTED_COUNTRIES.size &&
    [...SUPPORTED_COUNTRIES].every((country) =>
      unique.has(country),
    )
  );
}

// ======================================================
// ACCESO A DATOS
// ======================================================

async function loadBranches(): Promise<BranchRow[]> {
  const result = await pool.query<BranchRow>(`
    SELECT
      s.id,
      s.codigo,
      s.nombre,
      s.activa,
      su.pais_codigo AS "countryCode",
      NULLIF(TRIM(su.region), '') AS region
    FROM sucursales s
    LEFT JOIN sucursales_ubicaciones su
      ON su.sucursal_id = s.id
    ORDER BY s.nombre, s.codigo
  `);

  return result.rows;
}

// ======================================================
// VALIDACIÓN DEL SCOPE SOLICITADO
// ======================================================

function validateRegionSelection(
  scope: ReportScopeInput,
): void {
  if (!scope.countryCodes.length) {
    return;
  }

  const selectedCountries = new Set(scope.countryCodes);

  const invalidRegion = scope.regions.find(
    (region) => !selectedCountries.has(region.countryCode),
  );

  if (invalidRegion) {
    throw new ReportsScopeServiceError(
      "INVALID_SCOPE",
      `La región ${invalidRegion.name} no pertenece a uno de los países seleccionados.`,
    );
  }
}

function validateRequestedBranchesExist(
  rows: BranchRow[],
  requestedBranchIds: string[],
): BranchRow[] {
  if (!requestedBranchIds.length) {
    return [];
  }

  const byId = new Map(
    rows.map((row) => [row.id, row]),
  );

  const selected: BranchRow[] = [];

  for (const branchId of requestedBranchIds) {
    const branch = byId.get(branchId);

    if (!branch) {
      throw new ReportsScopeServiceError(
        "BRANCH_NOT_FOUND",
        "Una de las sucursales seleccionadas no existe.",
      );
    }

    selected.push(branch);
  }

  return selected;
}

function branchMatchesGeographicSelection(
  row: BranchRow,
  scope: ReportScopeInput,
): boolean {
  const selectedCountries = new Set(scope.countryCodes);
  const selectedRegions = new Set(
    scope.regions.map(regionKey),
  );

  const countriesAreGlobal =
    scope.countryCodes.length === 0 ||
    allSupportedCountriesSelected(scope.countryCodes);

  if (!countriesAreGlobal) {
    if (
      !isSupportedCountryCode(row.countryCode) ||
      !selectedCountries.has(row.countryCode)
    ) {
      return false;
    }
  }

  if (selectedRegions.size > 0) {
    const key = branchRegionKey(row);

    if (!key || !selectedRegions.has(key)) {
      return false;
    }
  }

  return true;
}

function buildResolvedScope(
  accessMode: ResolvedReportScope["accessMode"],
  rows: BranchRow[],
): ResolvedReportScope {
  const branches = rows.map(toScopeBranch);

  const activeBranches = branches.filter(
    (branch) => branch.activa,
  );

  const inactiveBranches = branches.filter(
    (branch) => !branch.activa,
  );

  const incompleteGeographyBranches = branches.filter(
    (branch) => !branch.hasCompleteGeography,
  );

  const warnings: ResolvedReportScope["warnings"] = [];

  if (incompleteGeographyBranches.length > 0) {
    warnings.push({
      code: "INCOMPLETE_GEOGRAPHY",
      message:
        "Hay sucursales incluidas con información geográfica incompleta. Puedes continuar, pero se recomienda completar país y región antes de generar reportes geográficos definitivos.",
      branchIds: incompleteGeographyBranches.map(
        (branch) => branch.id,
      ),
    });
  }

  return {
    accessMode,
    branchIds: branches.map((branch) => branch.id),
    branches,
    activeBranches,
    inactiveBranches,
    incompleteGeographyBranches,
    warnings,
  };
}

// ======================================================
// GERENTE
// ======================================================

function resolveManagerScope(
  user: ReportsAuthUser,
  scope: ReportScopeInput,
  rows: BranchRow[],
): ResolvedReportScope {
  const assignedIds = uniqueStrings(
    user.sucursales.map((branch) => branch.id),
  );

  if (assignedIds.length !== 1) {
    throw new ReportsScopeServiceError(
      "MANAGER_BRANCH_CONFIGURATION",
      "El gerente debe tener exactamente una sucursal asignada para utilizar Reportes.",
    );
  }

  const assignedId = assignedIds[0];

  if (!assignedId) {
    throw new ReportsScopeServiceError(
      "MANAGER_BRANCH_CONFIGURATION",
      "No fue posible determinar la sucursal asignada al gerente.",
    );
  }

  const branch = rows.find((row) => row.id === assignedId);

  if (!branch) {
    throw new ReportsScopeServiceError(
      "MANAGER_BRANCH_CONFIGURATION",
      "La sucursal asignada al gerente ya no existe.",
    );
  }

  if (isKnownUnsupportedCountry(branch)) {
    throw new ReportsScopeServiceError(
      "UNSUPPORTED_BRANCH_COUNTRY",
      "La sucursal asignada pertenece a un país que Reportes V1 todavía no soporta.",
    );
  }

  const requestedBranchIds = uniqueStrings(scope.branchIds);

  if (
    requestedBranchIds.length > 0 &&
    requestedBranchIds.some((id) => id !== assignedId)
  ) {
    throw new ReportsScopeServiceError(
      "BRANCH_NOT_ALLOWED",
      "Un gerente no puede generar reportes de otra sucursal.",
    );
  }

  if (
    scope.countryCodes.length > 0 ||
    scope.regions.length > 0
  ) {
    if (!branchMatchesGeographicSelection(branch, scope)) {
      throw new ReportsScopeServiceError(
        "BRANCH_NOT_ALLOWED",
        "El alcance geográfico solicitado no corresponde a la sucursal asignada al gerente.",
      );
    }
  }

  if (!branch.activa && !scope.includeInactiveBranches) {
    return buildResolvedScope(
      "manager",
      [],
    );
  }

  return buildResolvedScope(
    "manager",
    [branch],
  );
}

// ======================================================
// SUPERADMIN
// ======================================================

function resolveSuperAdminScope(
  scope: ReportScopeInput,
  rows: BranchRow[],
): ResolvedReportScope {
  validateRegionSelection(scope);

  const requestedBranchIds = uniqueStrings(scope.branchIds);
  const explicitlySelectedBranches =
    validateRequestedBranchesExist(
      rows,
      requestedBranchIds,
    );

  for (const branch of explicitlySelectedBranches) {
    if (isKnownUnsupportedCountry(branch)) {
      throw new ReportsScopeServiceError(
        "UNSUPPORTED_BRANCH_COUNTRY",
        `La sucursal ${branch.nombre} pertenece a un país que Reportes V1 todavía no soporta.`,
      );
    }

    if (!branch.activa && !scope.includeInactiveBranches) {
      throw new ReportsScopeServiceError(
        "INVALID_SCOPE",
        `La sucursal ${branch.nombre} está inactiva. Activa la opción de incluir sucursales inactivas para utilizarla.`,
      );
    }

    if (!branchMatchesGeographicSelection(branch, scope)) {
      throw new ReportsScopeServiceError(
        "INVALID_SCOPE",
        `La sucursal ${branch.nombre} no coincide con el país o región seleccionados.`,
      );
    }
  }

  let candidates = requestedBranchIds.length
    ? explicitlySelectedBranches
    : rows;

  candidates = candidates.filter(
    (branch) => !isKnownUnsupportedCountry(branch),
  );

  if (!scope.includeInactiveBranches) {
    candidates = candidates.filter(
      (branch) => branch.activa,
    );
  }

  const hasRegionFilter = scope.regions.length > 0;
  const countriesAreGlobal =
    scope.countryCodes.length === 0 ||
    allSupportedCountriesSelected(scope.countryCodes);

  /**
   * En alcance global (MX + CO) y sin filtro por región,
   * conservamos sucursales sin geografía para no perder activos
   * silenciosamente. Estas sucursales generan una advertencia.
   *
   * Si el usuario limita el reporte a un país o región concreta,
   * solamente incluimos sucursales cuya geografía permita demostrar
   * que pertenecen a ese alcance.
   */
  if (!countriesAreGlobal || hasRegionFilter) {
    candidates = candidates.filter((branch) =>
      branchMatchesGeographicSelection(branch, scope),
    );
  }

  return buildResolvedScope(
    "superadmin",
    candidates,
  );
}

// ======================================================
// API DEL SERVICIO
// ======================================================

/**
 * Convierte:
 *
 * usuario autenticado + selección del configurador
 *
 * en una lista efectiva de sucursales que el resto del módulo
 * puede consultar de forma segura.
 *
 * Las consultas de Reportes deben utilizar el scope resuelto y
 * NO volver a confiar directamente en los branchIds enviados por
 * el navegador.
 */
export async function resolveReportScope(
  user: ReportsAuthUser,
  scope: ReportScopeInput,
): Promise<ResolvedReportScope> {
  const superAdmin = isSuperAdmin(user);
  const manager = isManager(user);

  if (!superAdmin && !manager) {
    throw new ReportsScopeServiceError(
      "FORBIDDEN",
      "No tienes permisos para utilizar Reportes.",
    );
  }

  const rows = await loadBranches();

  if (superAdmin) {
    return resolveSuperAdminScope(
      scope,
      rows,
    );
  }

  return resolveManagerScope(
    user,
    scope,
    rows,
  );
}
