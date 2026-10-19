import type {
  ReportColumnKey,
  ReportDataIssueKey,
  ReportDateField,
  ReportDraft,
  ReportOptionsResult,
  ReportPreset,
  ReportPreviewInput,
  ReportSecondaryGrouping,
} from "../types/reports.types";

export interface ReportColumnDefinition {
  key: ReportColumnKey;
  label: string;
  group:
    | "Identidad"
    | "Ubicación"
    | "Asignación"
    | "Estado"
    | "Compra"
    | "Ciclo de vida";
}

export const REPORT_COLUMNS: ReportColumnDefinition[] = [
  { key: "inventoryNumber", label: "N.º inventario", group: "Identidad" },
  { key: "equipmentType", label: "Tipo de equipo", group: "Identidad" },
  { key: "brand", label: "Marca", group: "Identidad" },
  { key: "model", label: "Modelo", group: "Identidad" },
  { key: "serialNumber", label: "N.º serie", group: "Identidad" },
  { key: "hostname", label: "Hostname", group: "Identidad" },
  { key: "ipAddress", label: "Dirección IP", group: "Identidad" },
  { key: "operatingSystem", label: "Sistema operativo", group: "Identidad" },
  { key: "anydesk", label: "AnyDesk", group: "Identidad" },

  { key: "country", label: "País", group: "Ubicación" },
  { key: "region", label: "Región", group: "Ubicación" },
  { key: "branch", label: "Sucursal", group: "Ubicación" },
  { key: "branchStatus", label: "Estado sucursal", group: "Ubicación" },
  { key: "exactLocation", label: "Ubicación exacta", group: "Ubicación" },

  { key: "department", label: "Departamento", group: "Asignación" },
  { key: "responsible", label: "Responsable", group: "Asignación" },

  { key: "operatingStatus", label: "Funcionamiento", group: "Estado" },
  { key: "physicalCondition", label: "Condición física", group: "Estado" },
  { key: "incorporationType", label: "Incorporación", group: "Estado" },
  { key: "observations", label: "Observaciones", group: "Estado" },
  { key: "assetStatus", label: "Estado del activo", group: "Estado" },

  { key: "invoiceNumber", label: "N.º factura", group: "Compra" },
  { key: "invoiceDate", label: "Fecha factura", group: "Compra" },
  { key: "invoiceSupplier", label: "Proveedor", group: "Compra" },
  { key: "invoiceBusinessName", label: "Razón social", group: "Compra" },
  { key: "invoiceCurrency", label: "Moneda", group: "Compra" },
  { key: "invoiceTotal", label: "Total factura", group: "Compra" },
  { key: "invoiceItem", label: "Partida factura", group: "Compra" },
  { key: "acquisitionAmount", label: "Importe adquisición", group: "Compra" },

  { key: "createdAt", label: "Fecha de alta", group: "Ciclo de vida" },
  { key: "updatedAt", label: "Última actualización", group: "Ciclo de vida" },
  { key: "deactivatedAt", label: "Fecha de baja", group: "Ciclo de vida" },
  { key: "deactivationReason", label: "Motivo de baja", group: "Ciclo de vida" },
  { key: "deactivationDetail", label: "Detalle de baja", group: "Ciclo de vida" },
  { key: "reactivatedAt", label: "Fecha de reactivación", group: "Ciclo de vida" },
];

export const REPORT_COLUMN_LABELS =
  Object.fromEntries(
    REPORT_COLUMNS.map(
      (column) => [
        column.key,
        column.label,
      ],
    ),
  ) as Record<
    ReportColumnKey,
    string
  >;

export const DEFAULT_REPORT_COLUMNS: ReportColumnKey[] = [
  "inventoryNumber",
  "equipmentType",
  "brand",
  "model",
  "serialNumber",
  "branch",
  "department",
  "responsible",
  "operatingStatus",
  "physicalCondition",
];

export const DATA_ISSUE_OPTIONS: Array<{
  value: ReportDataIssueKey;
  label: string;
  description: string;
}> = [
  {
    value: "missing_responsible",
    label: "Sin responsable",
    description: "Equipos sin una persona responsable registrada.",
  },
  {
    value: "missing_invoice",
    label: "Factura pendiente",
    description: "Compras nuevas que todavía no tienen factura asociada.",
  },
  {
    value: "missing_acquisition_amount",
    label: "Sin importe",
    description: "Equipos sin importe de adquisición registrado.",
  },
  {
    value: "physical_damage",
    label: "Daño físico",
    description: "Equipos con condición física de daño relevante.",
  },
  {
    value: "operating_observations",
    label: "Con observaciones",
    description: "Equipos operativos que requieren observaciones.",
  },
  {
    value: "not_operational",
    label: "No operativo",
    description: "Equipos cuyo estado de funcionamiento es no operativo.",
  },
];

export const DATE_FIELD_OPTIONS: Array<{
  value: ReportDateField;
  label: string;
}> = [
  { value: "createdAt", label: "Fecha de alta" },
  { value: "updatedAt", label: "Última actualización" },
  { value: "deactivatedAt", label: "Fecha de baja" },
  { value: "reactivatedAt", label: "Fecha de reactivación" },
];

export const SECONDARY_GROUP_OPTIONS: Array<{
  value: ReportSecondaryGrouping;
  label: string;
}> = [
  { value: "equipmentType", label: "Tipo de equipo" },
  { value: "department", label: "Departamento" },
  { value: "operatingStatus", label: "Estado de funcionamiento" },
  { value: "physicalCondition", label: "Condición física" },
  { value: "incorporationType", label: "Tipo de incorporación" },
  { value: "brand", label: "Marca" },
];

function withSelectedColumns(
  draft: ReportDraft,
  columns: ReportColumnKey[],
): ReportDraft {
  return {
    ...draft,
    columns: {
      mode: "selected",
      values: columns,
    },
  };
}

export const REPORT_PRESETS: ReportPreset[] = [
  {
    id: "general",
    name: "Inventario general",
    description: "Vista operativa, limpia y útil para revisión cotidiana.",
    apply(current) {
      return withSelectedColumns(
        {
          ...current,
          assetStatus: "active",
          filters: {
            ...current.filters,
            responsibility: "all",
            dataIssues: [],
          },
          grouping: {
            geographic: true,
          },
        },
        DEFAULT_REPORT_COLUMNS,
      );
    },
  },
  {
    id: "location",
    name: "Por ubicación",
    description: "Prioriza país, región, sucursal y ubicación del equipo.",
    apply(current) {
      return withSelectedColumns(
        {
          ...current,
          assetStatus: "active",
          grouping: {
            geographic: true,
            secondary: "equipmentType",
          },
        },
        [
          "inventoryNumber",
          "equipmentType",
          "brand",
          "model",
          "country",
          "region",
          "branch",
          "exactLocation",
          "responsible",
        ],
      );
    },
  },
  {
    id: "attention",
    name: "Requiere atención",
    description: "Agrupa incidencias que conviene revisar operativamente.",
    apply(current) {
      return withSelectedColumns(
        {
          ...current,
          assetStatus: "active",
          filters: {
            ...current.filters,
            dataIssues:
              DATA_ISSUE_OPTIONS.map(
                (item) => item.value,
              ),
          },
          grouping: {
            geographic: true,
            secondary: "operatingStatus",
          },
        },
        [
          "inventoryNumber",
          "equipmentType",
          "brand",
          "model",
          "branch",
          "department",
          "responsible",
          "operatingStatus",
          "physicalCondition",
          "observations",
        ],
      );
    },
  },
  {
    id: "assignments",
    name: "Responsables",
    description: "Enfocado en asignaciones, áreas y ubicación física.",
    apply(current) {
      return withSelectedColumns(
        {
          ...current,
          assetStatus: "active",
          grouping: {
            geographic: true,
            secondary: "department",
          },
        },
        [
          "inventoryNumber",
          "equipmentType",
          "brand",
          "model",
          "branch",
          "department",
          "responsible",
          "exactLocation",
        ],
      );
    },
  },
  {
    id: "history",
    name: "Bajas y reactivaciones",
    description: "Campos de ciclo de vida para revisión histórica.",
    apply(current) {
      return withSelectedColumns(
        {
          ...current,
          assetStatus: "all",
          grouping: {
            geographic: true,
          },
        },
        [
          "inventoryNumber",
          "equipmentType",
          "brand",
          "model",
          "branch",
          "assetStatus",
          "createdAt",
          "deactivatedAt",
          "deactivationReason",
          "deactivationDetail",
          "reactivatedAt",
        ],
      );
    },
  },
];

export function createInitialReportDraft(
  options: ReportOptionsResult,
): ReportDraft {
  return {
    scope: {
      countryCodes:
        options.scope.defaultCountryCodes,
      regions: [],
      branchIds: [],
      includeInactiveBranches:
        options.scope.accessMode === "manager" &&
        options.scope.branches[0]?.activa === false,
    },

    assetStatus: "active",

    filters: {
      equipmentTypeCodes: [],
      departmentIds: [],
      operatingStatusCodes: [],
      physicalConditionCodes: [],
      incorporationTypeCodes: [],
      brands: [],
      responsibility: "all",
      dataIssues: [],
    },

    date: {
      enabled: false,
      field: "createdAt",
      from: "",
      to: "",
    },

    columns: {
      mode: "selected",
      values: DEFAULT_REPORT_COLUMNS,
    },

    grouping: {
      geographic: true,
    },
  };
}

export function toReportPreviewInput(
  draft: ReportDraft,
  page = 1,
): ReportPreviewInput {
  const date =
    draft.date.enabled &&
    (draft.date.from ||
      draft.date.to)
      ? {
          field:
            draft.date.field,
          ...(draft.date.from
            ? { from: draft.date.from }
            : {}),
          ...(draft.date.to
            ? { to: draft.date.to }
            : {}),
        }
      : undefined;

  return {
    scope: draft.scope,
    assetStatus: draft.assetStatus,
    filters: draft.filters,
    ...(date ? { date } : {}),
    columns: draft.columns,
    grouping: draft.grouping,
    page,
    pageSize: 50,
  };
}
