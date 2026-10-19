import type { AuthenticatedUser } from "./auth.js";

// ======================================================
// AUTORIZACIÓN
// ======================================================

/**
 * Información mínima del usuario que necesita Reportes.
 *
 * Evitamos duplicar manualmente la forma del usuario autenticado:
 * si AuthenticatedUser cambia, este tipo continúa tomando las
 * propiedades desde la fuente original.
 */
export type ReportsAuthUser = Pick<
  AuthenticatedUser,
  "id" | "roles" | "sucursales"
>;

// ======================================================
// ALCANCE GEOGRÁFICO
// ======================================================

/**
 * Países soportados funcionalmente por Reportes V1.
 */
export type ReportCountryCode = "MX" | "CO";

/**
 * Una región siempre queda asociada explícitamente a su país.
 *
 * Esto evita ambigüedades si dos países tienen regiones con el
 * mismo nombre.
 */
export interface ReportRegionSelection {
  countryCode: ReportCountryCode;
  name: string;
}

export interface ReportScopeInput {
  /**
   * Multiselección de países.
   *
   * Para SUPERADMIN, seleccionar MX + CO representa el alcance
   * global soportado actualmente.
   */
  countryCodes: ReportCountryCode[];

  /**
   * Multiselección de regiones, cada una ligada a su país.
   */
  regions: ReportRegionSelection[];

  /**
   * Multiselección de sucursales concretas.
   */
  branchIds: string[];

  /**
   * false:
   *   solo sucursales activas.
   *
   * true:
   *   también se incluyen sucursales inactivas dentro del
   *   alcance seleccionado.
   *
   * Las sucursales inactivas se presentarán separadas de las
   * activas en la vista previa y en las exportaciones.
   */
  includeInactiveBranches: boolean;
}

// ======================================================
// SCOPE RESUELTO POR BACKEND
// ======================================================

export interface ReportScopeBranch {
  id: string;
  codigo: string;
  nombre: string;
  activa: boolean;
  countryCode: ReportCountryCode | null;
  region: string | null;
  hasCompleteGeography: boolean;
}

export type ReportScopeAccessMode =
  | "manager"
  | "superadmin";

export type ReportScopeWarningCode =
  | "INCOMPLETE_GEOGRAPHY";

export interface ReportScopeWarning {
  code: ReportScopeWarningCode;
  message: string;
  branchIds: string[];
}

/**
 * Alcance final que el backend autoriza.
 *
 * Las consultas posteriores deben trabajar con branchIds y no
 * volver a interpretar por su cuenta los permisos del usuario.
 */
export interface ResolvedReportScope {
  accessMode: ReportScopeAccessMode;

  branchIds: string[];
  branches: ReportScopeBranch[];

  activeBranches: ReportScopeBranch[];
  inactiveBranches: ReportScopeBranch[];
  incompleteGeographyBranches: ReportScopeBranch[];

  warnings: ReportScopeWarning[];
}

// ======================================================
// ESTADO DEL ACTIVO
// ======================================================

export type ReportAssetStatus =
  | "active"
  | "inactive"
  | "all";

// ======================================================
// FILTROS
// ======================================================

export type ReportResponsibilityFilter =
  | "all"
  | "assigned"
  | "unassigned";

export type ReportDataIssueKey =
  | "missing_responsible"
  | "missing_invoice"
  | "missing_acquisition_amount"
  | "physical_damage"
  | "operating_observations"
  | "not_operational";

export interface ReportFiltersInput {
  equipmentTypeCodes: string[];
  departmentIds: string[];
  operatingStatusCodes: string[];
  physicalConditionCodes: string[];
  incorporationTypeCodes: string[];
  brands: string[];

  responsibility: ReportResponsibilityFilter;

  /**
   * Si se seleccionan varias condiciones especiales,
   * se interpretarán con OR:
   *
   * missing_responsible OR physical_damage OR ...
   */
  dataIssues: ReportDataIssueKey[];
}

// ======================================================
// FECHAS
// ======================================================

export type ReportDateField =
  | "createdAt"
  | "updatedAt"
  | "deactivatedAt"
  | "reactivatedAt";

export interface ReportDateFilterInput {
  field: ReportDateField;

  /**
   * Llegan como texto mediante JSON.
   * La validación real del formato se hará con Zod.
   */
  from?: string;
  to?: string;
}

// ======================================================
// COLUMNAS REPORTABLES
// ======================================================

/**
 * Claves públicas del motor de Reportes.
 *
 * IMPORTANTE:
 * estas claves NO son nombres de columnas SQL y nunca deben
 * interpolarse directamente dentro de una consulta.
 */
export type ReportColumnKey =
  | "inventoryNumber"
  | "equipmentType"
  | "brand"
  | "model"
  | "serialNumber"
  | "hostname"
  | "ipAddress"
  | "operatingSystem"
  | "anydesk"
  | "country"
  | "region"
  | "branch"
  | "branchStatus"
  | "department"
  | "responsible"
  | "exactLocation"
  | "operatingStatus"
  | "physicalCondition"
  | "incorporationType"
  | "observations"
  | "invoiceNumber"
  | "invoiceDate"
  | "invoiceSupplier"
  | "invoiceBusinessName"
  | "invoiceCurrency"
  | "invoiceTotal"
  | "invoiceItem"
  | "acquisitionAmount"
  | "assetStatus"
  | "createdAt"
  | "updatedAt"
  | "deactivatedAt"
  | "deactivationReason"
  | "deactivationDetail"
  | "reactivatedAt";

/**
 * Unión discriminada:
 *
 * mode = "all"
 *   → se utilizan todas las columnas reportables.
 *
 * mode = "selected"
 *   → values contiene las columnas elegidas por el usuario.
 */
export type ReportColumnsInput =
  | {
      mode: "all";
    }
  | {
      mode: "selected";
      values: ReportColumnKey[];
    };

// ======================================================
// AGRUPACIÓN
// ======================================================

export type ReportSecondaryGrouping =
  | "equipmentType"
  | "department"
  | "operatingStatus"
  | "physicalCondition"
  | "incorporationType"
  | "brand";

export interface ReportGroupingInput {
  /**
   * true:
   *   País → Región → Sucursal.
   *
   * false:
   *   resultado plano.
   */
  geographic: boolean;

  /**
   * Como máximo permitimos una agrupación secundaria en V1.
   */
  secondary?: ReportSecondaryGrouping;
}

// ======================================================
// PREVIEW
// ======================================================

export interface ReportPreviewInput {
  scope: ReportScopeInput;

  assetStatus: ReportAssetStatus;

  filters: ReportFiltersInput;

  date?: ReportDateFilterInput;

  columns: ReportColumnsInput;

  grouping: ReportGroupingInput;

  page?: number;
  pageSize?: number;
}

// ======================================================
// RESPUESTA VARIABLE
// ======================================================

export type ReportCellValue =
  | string
  | number
  | boolean
  | null;

/**
 * Como las columnas son configurables, una fila puede contener
 * únicamente una parte de todas las columnas disponibles.
 */
export type ReportPreviewRow = Partial<
  Record<ReportColumnKey, ReportCellValue>
>;

// ======================================================
// EXPORTACIÓN
// ======================================================

export type ReportExportFormat =
  | "pdf"
  | "xlsx";

export type ReportExportAdviceReason =
  | "row_count"
  | "column_count"
  | "content_width";

export interface ReportExportAdvice {
  /**
   * Recomendación de experiencia de usuario.
   * No implica necesariamente que PDF esté bloqueado.
   */
  recommendedFormat: ReportExportFormat;

  reasons: ReportExportAdviceReason[];

  /**
   * El benchmark de generación de documentos determinará
   * posteriormente cuándo debe pasar a false.
   */
  pdfAllowed: boolean;

  /**
   * Excel puede tener un límite duro distinto al PDF.
   * Si REPORT_XLSX_HARD_MAX_ROWS no está configurado,
   * el servicio utiliza el hard limit del PDF como fallback seguro.
   */
  xlsxAllowed: boolean;
}

// ======================================================
// RESPUESTA DEL PREVIEW
// ======================================================

export interface ReportPreviewResult {
  total: number;

  page: number;
  pageSize: number;
  totalPages: number;

  columns: ReportColumnKey[];

  rows: ReportPreviewRow[];

  scope: ResolvedReportScope;

  exportAdvice: ReportExportAdvice;
}

// ======================================================
// OPCIONES DEL CONFIGURADOR
// ======================================================

export interface ReportCatalogOption {
  id: string;
  code: string;
  name: string;
}

export interface ReportCountryOption {
  code: ReportCountryCode;
  label: string;
  branchCount: number;
}

export interface ReportOptionsScope {
  accessMode: ReportScopeAccessMode;

  /**
   * Países que el frontend debe mostrar seleccionados al abrir
   * el configurador.
   *
   * SUPERADMIN:
   *   MX + CO
   *
   * GERENTE:
   *   el país de su sucursal, si la geografía está completa.
   */
  defaultCountryCodes: ReportCountryCode[];

  countries: ReportCountryOption[];
  regions: ReportRegionSelection[];
  branches: ReportScopeBranch[];

  warnings: ReportScopeWarning[];
}

export interface ReportOptionsFilters {
  equipmentTypes: ReportCatalogOption[];
  departments: ReportCatalogOption[];
  operatingStatuses: ReportCatalogOption[];
  physicalConditions: ReportCatalogOption[];
  incorporationTypes: ReportCatalogOption[];
  brands: string[];
}

export interface ReportOptionsResult {
  scope: ReportOptionsScope;
  filters: ReportOptionsFilters;
}
