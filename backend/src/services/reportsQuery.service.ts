import { pool } from "../db/pool.js";

import type {
  ReportCellValue,
  ReportColumnKey,
  ReportDataIssueKey,
  ReportDateField,
  ReportPreviewInput,
  ReportPreviewRow,
  ReportSecondaryGrouping,
  ResolvedReportScope,
} from "../types/reports.js";

// ======================================================
// ERRORES
// ======================================================

export type ReportsQueryServiceErrorCode =
  | "INVALID_COLUMN"
  | "INVALID_DATE_FILTER"
  | "EXPORT_LIMIT_EXCEEDED";

export class ReportsQueryServiceError extends Error {
  readonly code: ReportsQueryServiceErrorCode;

  constructor(
    code: ReportsQueryServiceErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ReportsQueryServiceError";
    this.code = code;
  }
}

// ======================================================
// RESULTADO DEL MOTOR DE CONSULTA
// ======================================================

export interface ReportQueryResult {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  columns: ReportColumnKey[];
  rows: ReportPreviewRow[];
}

export interface ReportExportQueryResult {
  total: number;
  columns: ReportColumnKey[];
  rows: ReportPreviewRow[];
}

// ======================================================
// LÍMITES DEL PREVIEW
// ======================================================

export const REPORT_PREVIEW_DEFAULT_PAGE_SIZE = 50;
export const REPORT_PREVIEW_MAX_PAGE_SIZE = 100;

// ======================================================
// WHITELIST DE COLUMNAS
// ======================================================

/**
 * Lista explícita y ordenada de campos que Reportes puede exponer.
 *
 * IMPORTANTE:
 * - No usamos SELECT *.
 * - El navegador nunca envía expresiones SQL.
 * - Cada clave pública se traduce aquí a una expresión SQL conocida.
 */
export const REPORTABLE_COLUMN_KEYS = [
  "inventoryNumber",
  "equipmentType",
  "brand",
  "model",
  "serialNumber",
  "hostname",
  "ipAddress",
  "operatingSystem",
  "anydesk",
  "country",
  "region",
  "branch",
  "branchStatus",
  "department",
  "responsible",
  "exactLocation",
  "operatingStatus",
  "physicalCondition",
  "incorporationType",
  "observations",
  "invoiceNumber",
  "invoiceDate",
  "invoiceSupplier",
  "invoiceBusinessName",
  "invoiceCurrency",
  "invoiceTotal",
  "invoiceItem",
  "acquisitionAmount",
  "assetStatus",
  "createdAt",
  "updatedAt",
  "deactivatedAt",
  "deactivationReason",
  "deactivationDetail",
  "reactivatedAt",
] as const satisfies readonly ReportColumnKey[];

const REPORTABLE_COLUMN_SET =
  new Set<ReportColumnKey>(REPORTABLE_COLUMN_KEYS);

const COLUMN_SQL: Record<ReportColumnKey, string> = {
  inventoryNumber:
    "e.numero_inventario",

  equipmentType:
    "te.nombre",

  brand:
    "e.marca",

  model:
    "e.modelo",

  serialNumber:
    "e.numero_serie",

  hostname:
    "e.hostname",

  ipAddress:
    "e.direccion_ip::text",

  operatingSystem:
    "e.sistema_operativo",

  anydesk:
    "e.anydesk",

  country: `
    CASE su.pais_codigo
      WHEN 'MX' THEN 'México'
      WHEN 'CO' THEN 'Colombia'
      ELSE 'Ubicación no configurada'
    END
  `,

  region: `
    COALESCE(
      NULLIF(TRIM(su.region), ''),
      'Ubicación no configurada'
    )
  `,

  branch:
    "s.nombre",

  branchStatus: `
    CASE
      WHEN s.activa = TRUE THEN 'Activa'
      ELSE 'Inactiva'
    END
  `,

  department:
    "d.nombre",

  responsible:
    "e.responsable",

  exactLocation:
    "e.ubicacion_exacta",

  operatingStatus:
    "ef.nombre",

  physicalCondition:
    "cf.nombre",

  incorporationType:
    "ti.nombre",

  observations:
    "e.observaciones",

  invoiceNumber:
    "f.numero_factura",

  invoiceDate:
    "f.fecha_factura::text",

  invoiceSupplier:
    "f.proveedor_nombre",

  invoiceBusinessName:
    "f.razon_social",

  invoiceCurrency:
    "f.moneda",

  /**
   * Conservamos numeric como texto para no introducir pérdida
   * de precisión monetaria al convertir prematuramente a float.
   */
  invoiceTotal:
    "f.total::text",

  invoiceItem:
    "e.factura_partida",

  acquisitionAmount:
    "e.importe_adquisicion::text",

  assetStatus: `
    CASE
      WHEN e.activo = TRUE THEN 'Activo'
      ELSE 'Inactivo'
    END
  `,

  createdAt:
    "e.creado_en",

  updatedAt:
    "e.actualizado_en",

  deactivatedAt:
    "e.baja_en",

  deactivationReason:
    "mb.nombre",

  deactivationDetail:
    "e.detalle_baja",

  reactivatedAt:
    "e.reactivado_en",
};

// ======================================================
// MAPAS SEGUROS PARA FECHAS Y AGRUPACIONES
// ======================================================

const DATE_FIELD_SQL: Record<ReportDateField, string> = {
  createdAt: "e.creado_en",
  updatedAt: "e.actualizado_en",
  deactivatedAt: "e.baja_en",
  reactivatedAt: "e.reactivado_en",
};

const SECONDARY_GROUP_COLUMN: Record<
  ReportSecondaryGrouping,
  ReportColumnKey
> = {
  equipmentType: "equipmentType",
  department: "department",
  operatingStatus: "operatingStatus",
  physicalCondition: "physicalCondition",
  incorporationType: "incorporationType",
  brand: "brand",
};

// ======================================================
// CONDICIONES ESPECIALES
// ======================================================

/**
 * Estas expresiones son constantes internas.
 *
 * Cuando el usuario selecciona varias condiciones,
 * se combinan con OR dentro de un único grupo:
 *
 * (condicion_1 OR condicion_2 OR condicion_3)
 */
const DATA_ISSUE_SQL: Record<ReportDataIssueKey, string> = {
  missing_responsible:
    "COALESCE(TRIM(e.responsable), '') = ''",

  missing_invoice: `
    ti.codigo = 'COMPRA_NUEVA'
    AND e.factura_compra_id IS NULL
  `,

  missing_acquisition_amount:
    "e.importe_adquisicion IS NULL",

  physical_damage:
    "cf.codigo = 'DANO_RELEVANTE'",

  operating_observations:
    "ef.codigo = 'OPERATIVO_OBSERVACIONES'",

  not_operational:
    "ef.codigo = 'NO_OPERATIVO'",
};

// ======================================================
// SQL BASE
// ======================================================

const REPORT_FROM_SQL = `
  FROM equipos_ti e

  INNER JOIN tipos_equipo te
    ON te.id = e.tipo_equipo_id

  INNER JOIN sucursales s
    ON s.id = e.sucursal_id

  LEFT JOIN sucursales_ubicaciones su
    ON su.sucursal_id = s.id

  INNER JOIN departamentos d
    ON d.id = e.departamento_id

  INNER JOIN estados_funcionamiento ef
    ON ef.id = e.estado_funcionamiento_id

  INNER JOIN condiciones_fisicas cf
    ON cf.id = e.condicion_fisica_id

  INNER JOIN tipos_incorporacion ti
    ON ti.id = e.tipo_incorporacion_id

  LEFT JOIN facturas_compra_ti f
    ON f.id = e.factura_compra_id

  LEFT JOIN motivos_baja_equipo mb
    ON mb.id = e.motivo_baja_id
`;

// ======================================================
// HELPERS GENERALES
// ======================================================

function uniqueValues<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function normalizePage(value?: number): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return 1;
  }

  return Math.max(
    Math.trunc(value),
    1,
  );
}

function normalizePageSize(value?: number): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return REPORT_PREVIEW_DEFAULT_PAGE_SIZE;
  }

  return Math.min(
    Math.max(
      Math.trunc(value),
      1,
    ),
    REPORT_PREVIEW_MAX_PAGE_SIZE,
  );
}

function isReportColumnKey(
  value: string,
): value is ReportColumnKey {
  return REPORTABLE_COLUMN_SET.has(
    value as ReportColumnKey,
  );
}

// ======================================================
// RESOLUCIÓN DE COLUMNAS
// ======================================================

/**
 * Columnas visibles elegidas por el usuario.
 *
 * Número de inventario siempre queda incluido porque es el
 * identificador funcional mínimo de cada fila del reporte.
 */
function resolveDisplayColumns(
  input: ReportPreviewInput,
): ReportColumnKey[] {
  if (input.columns.mode === "all") {
    return [...REPORTABLE_COLUMN_KEYS];
  }

  for (const value of input.columns.values) {
    if (!isReportColumnKey(value)) {
      throw new ReportsQueryServiceError(
        "INVALID_COLUMN",
        "Una de las columnas solicitadas no está permitida en Reportes.",
      );
    }
  }

  const selected = uniqueValues(
    input.columns.values,
  );

  if (!selected.includes("inventoryNumber")) {
    return [
      "inventoryNumber",
      ...selected,
    ];
  }

  return selected;
}

/**
 * Algunas columnas pueden ser necesarias para ordenar/agrupar aunque
 * el usuario no quiera mostrarlas como columnas visibles.
 *
 * Ejemplo:
 * geographic = true
 * → necesitamos país, región y sucursal para construir secciones,
 *   aunque no aparezcan como columnas de la tabla.
 *
 * `displayColumns` sigue indicando qué se debe renderizar.
 */
function resolveQueryColumns(
  input: ReportPreviewInput,
  displayColumns: ReportColumnKey[],
): ReportColumnKey[] {
  const queryColumns = [...displayColumns];

  if (input.grouping.geographic) {
    queryColumns.push(
      "country",
      "region",
      "branch",
      "branchStatus",
    );
  }

  if (input.grouping.secondary) {
    queryColumns.push(
      SECONDARY_GROUP_COLUMN[
        input.grouping.secondary
      ],
    );
  }

  return uniqueValues(queryColumns);
}

function buildSelectSql(
  columns: ReportColumnKey[],
): string {
  return columns
    .map((key) => {
      const expression = COLUMN_SQL[key];

      return `${expression} AS "${key}"`;
    })
    .join(",\n");
}

// ======================================================
// VALIDACIÓN DE FECHAS
// ======================================================

function isIsoDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [yearText, monthText, dayText] =
    value.split("-");

  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return false;
  }

  const test = new Date(
    Date.UTC(
      year,
      month - 1,
      day,
    ),
  );

  return (
    test.getUTCFullYear() === year &&
    test.getUTCMonth() === month - 1 &&
    test.getUTCDate() === day
  );
}

function validateDateFilter(
  input: ReportPreviewInput,
): void {
  const date = input.date;

  if (!date) {
    return;
  }

  if (
    date.from !== undefined &&
    !isIsoDateOnly(date.from)
  ) {
    throw new ReportsQueryServiceError(
      "INVALID_DATE_FILTER",
      "La fecha inicial debe utilizar el formato YYYY-MM-DD.",
    );
  }

  if (
    date.to !== undefined &&
    !isIsoDateOnly(date.to)
  ) {
    throw new ReportsQueryServiceError(
      "INVALID_DATE_FILTER",
      "La fecha final debe utilizar el formato YYYY-MM-DD.",
    );
  }

  if (
    date.from &&
    date.to &&
    date.from > date.to
  ) {
    throw new ReportsQueryServiceError(
      "INVALID_DATE_FILTER",
      "La fecha inicial no puede ser posterior a la fecha final.",
    );
  }
}

// ======================================================
// CONSTRUCTOR DE FILTROS
// ======================================================

interface BuiltReportFilters {
  where: string;
  params: unknown[];
}

function buildReportFilters(
  input: ReportPreviewInput,
  scope: ResolvedReportScope,
): BuiltReportFilters {
  const conditions: string[] = [];
  const params: unknown[] = [];

  function addParam(value: unknown): string {
    params.push(value);
    return `$${params.length}`;
  }

  // ----------------------------------------------------
  // SCOPE AUTORIZADO
  // ----------------------------------------------------

  if (scope.branchIds.length === 0) {
    conditions.push("FALSE");
  } else {
    const parameter = addParam(
      scope.branchIds,
    );

    conditions.push(
      `e.sucursal_id = ANY(${parameter}::uuid[])`,
    );
  }

  // ----------------------------------------------------
  // ESTADO DEL ACTIVO
  // ----------------------------------------------------

  if (input.assetStatus === "active") {
    conditions.push("e.activo = TRUE");
  } else if (input.assetStatus === "inactive") {
    conditions.push("e.activo = FALSE");
  }

  // ----------------------------------------------------
  // TIPO DE EQUIPO
  // ----------------------------------------------------

  if (input.filters.equipmentTypeCodes.length > 0) {
    const parameter = addParam(
      uniqueValues(
        input.filters.equipmentTypeCodes,
      ),
    );

    conditions.push(
      `te.codigo = ANY(${parameter}::text[])`,
    );
  }

  // ----------------------------------------------------
  // DEPARTAMENTO
  // ----------------------------------------------------

  if (input.filters.departmentIds.length > 0) {
    const parameter = addParam(
      uniqueValues(
        input.filters.departmentIds,
      ),
    );

    conditions.push(
      `e.departamento_id = ANY(${parameter}::uuid[])`,
    );
  }

  // ----------------------------------------------------
  // ESTADO DE FUNCIONAMIENTO
  // ----------------------------------------------------

  if (
    input.filters.operatingStatusCodes.length > 0
  ) {
    const parameter = addParam(
      uniqueValues(
        input.filters.operatingStatusCodes,
      ),
    );

    conditions.push(
      `ef.codigo = ANY(${parameter}::text[])`,
    );
  }

  // ----------------------------------------------------
  // CONDICIÓN FÍSICA
  // ----------------------------------------------------

  if (
    input.filters.physicalConditionCodes.length > 0
  ) {
    const parameter = addParam(
      uniqueValues(
        input.filters.physicalConditionCodes,
      ),
    );

    conditions.push(
      `cf.codigo = ANY(${parameter}::text[])`,
    );
  }

  // ----------------------------------------------------
  // TIPO DE INCORPORACIÓN
  // ----------------------------------------------------

  if (
    input.filters.incorporationTypeCodes.length > 0
  ) {
    const parameter = addParam(
      uniqueValues(
        input.filters.incorporationTypeCodes,
      ),
    );

    conditions.push(
      `ti.codigo = ANY(${parameter}::text[])`,
    );
  }

  // ----------------------------------------------------
  // MARCA
  // ----------------------------------------------------

  if (input.filters.brands.length > 0) {
    const normalizedBrands = uniqueValues(
      input.filters.brands
        .map((brand) =>
          brand
            .normalize("NFKC")
            .trim()
            .toLocaleLowerCase("es-MX"),
        )
        .filter(Boolean),
    );

    if (normalizedBrands.length > 0) {
      const parameter = addParam(
        normalizedBrands,
      );

      conditions.push(
        `LOWER(TRIM(e.marca)) = ANY(${parameter}::text[])`,
      );
    }
  }

  // ----------------------------------------------------
  // RESPONSABLE
  // ----------------------------------------------------

  if (
    input.filters.responsibility === "assigned"
  ) {
    conditions.push(
      "COALESCE(TRIM(e.responsable), '') <> ''",
    );
  } else if (
    input.filters.responsibility === "unassigned"
  ) {
    conditions.push(
      "COALESCE(TRIM(e.responsable), '') = ''",
    );
  }

  // ----------------------------------------------------
  // CONDICIONES ESPECIALES
  // ----------------------------------------------------

  if (input.filters.dataIssues.length > 0) {
    const selectedIssues = uniqueValues(
      input.filters.dataIssues,
    );

    const issueConditions = selectedIssues.map(
      (issue) => DATA_ISSUE_SQL[issue],
    );

    /**
     * Decisión funcional:
     *
     * Varias condiciones especiales se interpretan con OR.
     *
     * El resto de categorías de filtros sigue combinándose
     * normalmente con AND.
     */
    conditions.push(
      `(${issueConditions.join(" OR ")})`,
    );
  }

  // ----------------------------------------------------
  // FECHAS
  // ----------------------------------------------------

  if (input.date) {
    const fieldSql =
      DATE_FIELD_SQL[input.date.field];

    if (input.date.from) {
      const parameter = addParam(
        input.date.from,
      );

      conditions.push(
        `${fieldSql} >= ${parameter}::date`,
      );
    }

    if (input.date.to) {
      const parameter = addParam(
        input.date.to,
      );

      /**
       * El límite superior es exclusivo para incluir el día
       * completo seleccionado.
       *
       * Ejemplo:
       * to = 2026-10-01
       * → fecha < 2026-10-02 00:00
       */
      conditions.push(
        `${fieldSql} < (${parameter}::date + INTERVAL '1 day')`,
      );
    }
  }

  return {
    where:
      conditions.length > 0
        ? conditions.join(" AND ")
        : "TRUE",
    params,
  };
}

// ======================================================
// ORDEN DEL REPORTE
// ======================================================

function buildOrderBySql(
  input: ReportPreviewInput,
): string {
  const order: string[] = [];

  if (input.grouping.geographic) {
    /**
     * 1. Sucursales activas.
     * 2. Dentro de cada bloque, geografía conocida primero.
     * 3. Sucursales inactivas al final.
     *
     * Esto permite posteriormente representar:
     *
     * México / Colombia
     * Ubicación no configurada
     * Sucursales inactivas
     */
    order.push(`
      CASE
        WHEN s.activa = TRUE THEN 0
        ELSE 1
      END
    `);

    order.push(`
      CASE
        WHEN su.pais_codigo IN ('MX', 'CO')
         AND NULLIF(TRIM(su.region), '') IS NOT NULL
        THEN 0
        ELSE 1
      END
    `);

    order.push(
      "su.pais_codigo NULLS LAST",
      "su.region NULLS LAST",
      "s.nombre",
    );
  }

  if (input.grouping.secondary) {
    const columnKey =
      SECONDARY_GROUP_COLUMN[
        input.grouping.secondary
      ];

    order.push(
      `${COLUMN_SQL[columnKey]} NULLS LAST`,
    );
  }

  order.push(
    "e.numero_inventario",
    "e.id",
  );

  return order.join(",\n");
}

// ======================================================
// NORMALIZACIÓN DE RESULTADOS
// ======================================================

function normalizeCellValue(
  value: unknown,
): ReportCellValue {
  if (value === null) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  /**
   * Esta rama no debería utilizarse con las columnas actuales,
   * pero evita enviar objetos arbitrarios al contrato público.
   */
  return String(value);
}

function normalizeRow(
  row: Record<string, unknown>,
  queryColumns: ReportColumnKey[],
): ReportPreviewRow {
  const normalized: ReportPreviewRow = {};

  for (const key of queryColumns) {
    if (!(key in row)) {
      continue;
    }

    normalized[key] =
      normalizeCellValue(row[key]);
  }

  return normalized;
}

// ======================================================
// API DEL SERVICIO
// ======================================================

/**
 * Ejecuta el motor de consulta del preview.
 *
 * Este servicio NO decide permisos.
 * Recibe un ResolvedReportScope que ya fue autorizado por
 * reportsScope.service.ts.
 *
 * Tampoco genera PDF/XLSX: su responsabilidad es devolver
 * exactamente los datos paginados que corresponden a una
 * configuración de Reportes.
 */
export async function queryReportPreview(
  input: ReportPreviewInput,
  scope: ResolvedReportScope,
): Promise<ReportQueryResult> {
  validateDateFilter(input);

  const displayColumns =
    resolveDisplayColumns(input);

  const queryColumns =
    resolveQueryColumns(
      input,
      displayColumns,
    );

  const page = normalizePage(input.page);
  const pageSize =
    normalizePageSize(input.pageSize);

  const offset =
    (page - 1) * pageSize;

  /**
   * Un scope vacío es un resultado válido.
   *
   * Ejemplo:
   * gerente cuya sucursal está inactiva y no activó
   * "Incluir sucursales inactivas".
   */
  if (scope.branchIds.length === 0) {
    return {
      total: 0,
      page,
      pageSize,
      totalPages: 0,
      columns: displayColumns,
      rows: [],
    };
  }

  const { where, params } =
    buildReportFilters(
      input,
      scope,
    );

  const selectSql =
    buildSelectSql(queryColumns);

  const orderBySql =
    buildOrderBySql(input);

  const countPromise =
    pool.query<{ total: number }>(
      `
        SELECT
          COUNT(*)::int AS total
        ${REPORT_FROM_SQL}
        WHERE ${where}
      `,
      params,
    );

  const listParams = [
    ...params,
    pageSize,
    offset,
  ];

  const pageSizeParameter =
    `$${params.length + 1}`;

  const offsetParameter =
    `$${params.length + 2}`;

  const rowsPromise =
    pool.query<Record<string, unknown>>(
      `
        SELECT
          ${selectSql}
        ${REPORT_FROM_SQL}
        WHERE ${where}
        ORDER BY
          ${orderBySql}
        LIMIT ${pageSizeParameter}
        OFFSET ${offsetParameter}
      `,
      listParams,
    );

  const [
    countResult,
    rowsResult,
  ] = await Promise.all([
    countPromise,
    rowsPromise,
  ]);

  const total =
    countResult.rows[0]?.total ?? 0;

  return {
    total,
    page,
    pageSize,
    totalPages:
      total === 0
        ? 0
        : Math.ceil(total / pageSize),
    columns: displayColumns,
    rows: rowsResult.rows.map((row) =>
      normalizeRow(
        row,
        queryColumns,
      ),
    ),
  };
}

/**
 * Ejecuta la misma definición de reporte que utiliza el preview,
 * pero recupera el conjunto completo necesario para una exportación.
 *
 * La diferencia importante es que el caller DEBE proporcionar
 * un límite máximo de filas ya decidido por la política de exportación.
 *
 * No existe una consulta "alternativa" para PDF:
 * filtros, columnas, alcance y orden reutilizan exactamente el
 * mismo motor que el preview.
 */
export async function queryReportExport(
  input: ReportPreviewInput,
  scope: ResolvedReportScope,
  maxRows: number,
): Promise<ReportExportQueryResult> {
  validateDateFilter(input);

  if (
    !Number.isInteger(maxRows) ||
    maxRows <= 0
  ) {
    throw new ReportsQueryServiceError(
      "EXPORT_LIMIT_EXCEEDED",
      "El límite de exportación no es válido.",
    );
  }

  const displayColumns =
    resolveDisplayColumns(input);

  const queryColumns =
    resolveQueryColumns(
      input,
      displayColumns,
    );

  if (scope.branchIds.length === 0) {
    return {
      total: 0,
      columns: displayColumns,
      rows: [],
    };
  }

  const { where, params } =
    buildReportFilters(
      input,
      scope,
    );

  const selectSql =
    buildSelectSql(queryColumns);

  const orderBySql =
    buildOrderBySql(input);

  /**
   * Exportar es distinto a visualizar una página:
   * COUNT y SELECT deben representar el mismo instante lógico.
   *
   * REPEATABLE READ + READ ONLY crea una fotografía consistente
   * para toda la exportación. Así evitamos que una alta/baja
   * concurrente provoque que el encabezado diga 500 registros
   * mientras el PDF realmente contiene 499 o 501.
   */
  const client =
    await pool.connect();

  try {
    await client.query(
      "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY",
    );

    const countResult =
      await client.query<{ total: number }>(
        `
          SELECT
            COUNT(*)::int AS total
          ${REPORT_FROM_SQL}
          WHERE ${where}
        `,
        params,
      );

    const total =
      countResult.rows[0]?.total ?? 0;

    if (total > maxRows) {
      throw new ReportsQueryServiceError(
        "EXPORT_LIMIT_EXCEEDED",
        `El reporte contiene ${total} registros y supera el límite de ${maxRows} permitido para esta exportación.`,
      );
    }

    const listParams = [
      ...params,
      maxRows + 1,
    ];

    const limitParameter =
      `$${params.length + 1}`;

    const rowsResult =
      await client.query<Record<string, unknown>>(
        `
          SELECT
            ${selectSql}
          ${REPORT_FROM_SQL}
          WHERE ${where}
          ORDER BY
            ${orderBySql}
          LIMIT ${limitParameter}
        `,
        listParams,
      );

    if (rowsResult.rows.length > maxRows) {
      throw new ReportsQueryServiceError(
        "EXPORT_LIMIT_EXCEEDED",
        "El reporte supera el límite permitido para esta exportación.",
      );
    }

    await client.query(
      "COMMIT",
    );

    return {
      total,
      columns: displayColumns,
      rows: rowsResult.rows.map((row) =>
        normalizeRow(
          row,
          queryColumns,
        ),
      ),
    };
  } catch (error) {
    await client
      .query("ROLLBACK")
      .catch(() => undefined);

    throw error;
  } finally {
    client.release();
  }
}
