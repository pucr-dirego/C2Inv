// ======================================================
// ALCANCE
// ======================================================

export type ReportCountryCode = "MX" | "CO";

export interface ReportRegionSelection {
  countryCode: ReportCountryCode;
  name: string;
}

export interface ReportScopeInput {
  countryCodes: ReportCountryCode[];
  regions: ReportRegionSelection[];
  branchIds: string[];
  includeInactiveBranches: boolean;
}

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
// FILTROS
// ======================================================

export type ReportAssetStatus =
  | "active"
  | "inactive"
  | "all";

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
  from?: string;
  to?: string;
}

// ======================================================
// COLUMNAS
// ======================================================

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
  geographic: boolean;
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

export type ReportCellValue =
  | string
  | number
  | boolean
  | null;

export type ReportPreviewRow = Partial<
  Record<ReportColumnKey, ReportCellValue>
>;

export type ReportExportFormat =
  | "pdf"
  | "xlsx";

export type ReportExportAdviceReason =
  | "row_count"
  | "column_count"
  | "content_width";

export interface ReportExportAdvice {
  recommendedFormat: ReportExportFormat;
  reasons: ReportExportAdviceReason[];
  pdfAllowed: boolean;
  xlsxAllowed: boolean;
}

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

// ======================================================
// ESTADO LOCAL DEL CONFIGURADOR
// ======================================================

export interface ReportDraftDate {
  enabled: boolean;
  field: ReportDateField;
  from: string;
  to: string;
}

export interface ReportDraft {
  scope: ReportScopeInput;
  assetStatus: ReportAssetStatus;
  filters: ReportFiltersInput;
  date: ReportDraftDate;
  columns: ReportColumnsInput;
  grouping: ReportGroupingInput;
}

export interface ReportPreset {
  id:
    | "general"
    | "location"
    | "attention"
    | "assignments"
    | "history";
  name: string;
  description: string;
  apply: (
    current: ReportDraft,
  ) => ReportDraft;
}
