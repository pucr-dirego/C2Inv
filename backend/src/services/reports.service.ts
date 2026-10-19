import {
  getReportOptionsFromScope,
} from "./reportsOptions.service.js";

import {
  ReportsQueryServiceError,
  type ReportsQueryServiceErrorCode,
  queryReportExport,
  queryReportPreview,
} from "./reportsQuery.service.js";

import {
  renderReportPdf,
} from "./reportsPdf.service.js";

import {
  renderReportXlsx,
} from "./reportsExcel.service.js";

import {
  performance,
} from "node:perf_hooks";

import {
  ReportsScopeServiceError,
  type ReportsScopeServiceErrorCode,
  resolveReportScope,
} from "./reportsScope.service.js";

import type {
  ReportExportAdvice,
  ReportOptionsResult,
  ReportScopeInput,
  ReportPreviewInput,
  ReportPreviewResult,
  ReportsAuthUser,
} from "../types/reports.js";

// ======================================================
// ERRORES PÚBLICOS DEL MÓDULO
// ======================================================

export type ReportsServiceErrorCode =
  | ReportsScopeServiceErrorCode
  | ReportsQueryServiceErrorCode
  | "REPORTS_CONFIGURATION_ERROR";

export class ReportsServiceError extends Error {
  readonly code: ReportsServiceErrorCode;

  constructor(
    code: ReportsServiceErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ReportsServiceError";
    this.code = code;
  }
}

// ======================================================
// POLÍTICA DE EXPORTACIÓN
// ======================================================

/**
 * Estos límites NO se inventan en código.
 *
 * Quedan sin configurar hasta que hagamos el benchmark real
 * del servidor con diferentes cantidades de filas/columnas.
 *
 * Después podremos definir, por ejemplo, mediante .env:
 *
 * REPORT_PDF_RECOMMENDED_MAX_ROWS=...
 * REPORT_PDF_RECOMMENDED_MAX_COLUMNS=...
 * REPORT_PDF_HARD_MAX_ROWS=...
 *
 * Si una variable no existe, esa regla todavía no participa
 * en la recomendación.
 */
interface ReportExportPolicy {
  recommendedMaxRows: number | null;
  recommendedMaxColumns: number | null;
  pdfHardMaxRows: number | null;
  xlsxHardMaxRows: number | null;
}

function readPositiveIntegerEnv(
  name: string,
): number | null {
  const raw = process.env[name];

  if (
    raw === undefined ||
    raw.trim() === ""
  ) {
    return null;
  }

  const value = Number(raw);

  if (
    !Number.isInteger(value) ||
    value <= 0
  ) {
    throw new ReportsServiceError(
      "REPORTS_CONFIGURATION_ERROR",
      `La variable ${name} debe ser un entero positivo.`,
    );
  }

  return value;
}

function getExportPolicy(): ReportExportPolicy {
  const policy: ReportExportPolicy = {
    recommendedMaxRows:
      readPositiveIntegerEnv(
        "REPORT_PDF_RECOMMENDED_MAX_ROWS",
      ),

    recommendedMaxColumns:
      readPositiveIntegerEnv(
        "REPORT_PDF_RECOMMENDED_MAX_COLUMNS",
      ),

    pdfHardMaxRows:
      readPositiveIntegerEnv(
        "REPORT_PDF_HARD_MAX_ROWS",
      ),

    xlsxHardMaxRows:
      readPositiveIntegerEnv(
        "REPORT_XLSX_HARD_MAX_ROWS",
      ),
  };

  if (
    policy.recommendedMaxRows !== null &&
    policy.pdfHardMaxRows !== null &&
    policy.recommendedMaxRows >
      policy.pdfHardMaxRows
  ) {
    throw new ReportsServiceError(
      "REPORTS_CONFIGURATION_ERROR",
      "REPORT_PDF_RECOMMENDED_MAX_ROWS no puede ser mayor que REPORT_PDF_HARD_MAX_ROWS.",
    );
  }

  return policy;
}

function effectiveXlsxHardMaxRows(
  policy: ReportExportPolicy,
): number | null {
  /**
   * Fallback deliberadamente conservador:
   *
   * si todavía no se configuró un límite específico para XLSX,
   * Excel hereda el límite duro del PDF en lugar de quedar
   * ilimitado.
   *
   * Después del benchmark podemos elevar XLSX de forma explícita
   * sin tocar código.
   */
  return (
    policy.xlsxHardMaxRows ??
    policy.pdfHardMaxRows
  );
}

function pushUniqueReason(
  reasons: ReportExportAdvice["reasons"],
  reason: ReportExportAdvice["reasons"][number],
): void {
  if (!reasons.includes(reason)) {
    reasons.push(reason);
  }
}

/**
 * Calcula solamente la recomendación de formato.
 *
 * IMPORTANTE:
 * En este momento los límites pueden estar sin calibrar.
 * Eso es deliberado: acordamos medir primero el comportamiento
 * real del servidor antes de fijar N.
 *
 * La disponibilidad real de cada formato depende de que exista
 * un hard limit configurado. Esto evita mostrar un botón que
 * después fallaría con un error de configuración.
 */
function buildExportAdvice(
  totalRows: number,
  visibleColumnCount: number,
): ReportExportAdvice {
  const policy =
    getExportPolicy();

  const reasons:
    ReportExportAdvice["reasons"] =
      [];

  let pdfAllowed =
    policy.pdfHardMaxRows !== null &&
    totalRows <= policy.pdfHardMaxRows;

  if (
    policy.recommendedMaxRows !== null &&
    totalRows > policy.recommendedMaxRows
  ) {
    pushUniqueReason(
      reasons,
      "row_count",
    );
  }

  if (
    policy.recommendedMaxColumns !== null &&
    visibleColumnCount >
      policy.recommendedMaxColumns
  ) {
    pushUniqueReason(
      reasons,
      "column_count",
    );
  }

  if (
    policy.pdfHardMaxRows !== null &&
    totalRows >
      policy.pdfHardMaxRows
  ) {
    pushUniqueReason(
      reasons,
      "row_count",
    );
  }

  const xlsxHardMaxRows =
    effectiveXlsxHardMaxRows(
      policy,
    );

  const xlsxAllowed =
    xlsxHardMaxRows !== null &&
    totalRows <= xlsxHardMaxRows;

  let recommendedFormat:
    ReportExportAdvice["recommendedFormat"];

  if (
    pdfAllowed &&
    xlsxAllowed
  ) {
    recommendedFormat =
      reasons.length > 0
        ? "xlsx"
        : "pdf";
  } else if (xlsxAllowed) {
    recommendedFormat =
      "xlsx";
  } else {
    recommendedFormat =
      "pdf";
  }

  return {
    recommendedFormat,
    reasons,
    pdfAllowed,
    xlsxAllowed,
  };
}

// ======================================================
// EXPORTACIÓN PDF
// ======================================================

export interface ReportPdfMetrics {
  rows: number;
  columns: number;
  pages: number;
  bytes: number;
  queryMs: number;
  renderMs: number;
  totalMs: number;
  rssDeltaBytes: number;
}

export interface ReportPdfExportResult {
  buffer: Buffer;
  filename: string;
  metrics: ReportPdfMetrics;
}

export interface ReportXlsxMetrics {
  rows: number;
  columns: number;
  worksheets: number;
  bytes: number;
  queryMs: number;
  renderMs: number;
  totalMs: number;
  rssDeltaBytes: number;
}

export interface ReportXlsxExportResult {
  buffer: Buffer;
  filename: string;
  metrics: ReportXlsxMetrics;
}

/**
 * Para generar PDF sí exigimos un límite duro configurado.
 *
 * El preview puede operar sin este valor porque solo trae 50/100
 * registros; una exportación completa no debe quedar ilimitada.
 *
 * Durante el benchmark utilizaremos 500 porque coincide con el
 * dataset QA actual. Ese número NO se considera todavía el límite
 * final de producción.
 */
function requirePdfHardMaxRows(): number {
  const hardMaxRows =
    getExportPolicy()
      .pdfHardMaxRows;

  if (hardMaxRows === null) {
    throw new ReportsServiceError(
      "REPORTS_CONFIGURATION_ERROR",
      "Configura REPORT_PDF_HARD_MAX_ROWS antes de habilitar la exportación PDF.",
    );
  }

  return hardMaxRows;
}

function requireXlsxHardMaxRows(): number {
  const hardMaxRows =
    effectiveXlsxHardMaxRows(
      getExportPolicy(),
    );

  if (hardMaxRows === null) {
    throw new ReportsServiceError(
      "REPORTS_CONFIGURATION_ERROR",
      "Configura REPORT_XLSX_HARD_MAX_ROWS o REPORT_PDF_HARD_MAX_ROWS antes de habilitar la exportación Excel.",
    );
  }

  return hardMaxRows;
}

function reportPdfFilename(
  generatedAt: Date,
): string {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          process.env.REPORT_TIME_ZONE ??
          "America/Monterrey",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      },
    )
      .formatToParts(
        generatedAt,
      )
      .reduce<
        Record<
          string,
          string
        >
      >(
        (
          result,
          part,
        ) => {
          result[part.type] =
            part.value;
          return result;
        },
        {},
      );

  const stamp =
    `${parts.year ?? "0000"}${parts.month ?? "00"}${parts.day ?? "00"}-${parts.hour ?? "00"}${parts.minute ?? "00"}${parts.second ?? "00"}`;

  return `inventarios-ti-reporte-${stamp}.pdf`;
}

function reportXlsxFilename(
  generatedAt: Date,
): string {
  return reportPdfFilename(
    generatedAt,
  ).replace(
    /\.pdf$/,
    ".xlsx",
  );
}

// ======================================================
// NORMALIZACIÓN DE ERRORES INTERNOS
// ======================================================

/**
 * El controller no debería tener que conocer todos los servicios
 * internos usados por Reportes.
 *
 * Scope y Query pueden tener sus propios errores especializados,
 * pero hacia afuera exponemos una sola clase:
 *
 * ReportsServiceError
 */
function rethrowKnownServiceError(
  error: unknown,
): never {
  if (error instanceof ReportsScopeServiceError) {
    throw new ReportsServiceError(
      error.code,
      error.message,
    );
  }

  if (error instanceof ReportsQueryServiceError) {
    throw new ReportsServiceError(
      error.code,
      error.message,
    );
  }

  throw error;
}

// ======================================================
// API PÚBLICA DEL SERVICIO
// ======================================================

/**
 * Orquesta la generación de una vista previa de Reportes.
 *
 * Flujo:
 *
 * 1. Resolver el alcance autorizado.
 * 2. Consultar PostgreSQL usando únicamente ese alcance.
 * 3. Calcular recomendaciones de exportación.
 * 4. Devolver un contrato único al controller.
 *
 * Este servicio NO:
 * - valida HTTP;
 * - genera PDF;
 * - renderiza archivos binarios por sí mismo;
 * - decide estilos de frontend;
 * - vuelve a implementar permisos por su cuenta.
 */
export async function getReportPreview(
  user: ReportsAuthUser,
  input: ReportPreviewInput,
): Promise<ReportPreviewResult> {
  try {
    const scope = await resolveReportScope(
      user,
      input.scope,
    );

    const queryResult =
      await queryReportPreview(
        input,
        scope,
      );

    const exportAdvice =
      buildExportAdvice(
        queryResult.total,
        queryResult.columns.length,
      );

    return {
      total: queryResult.total,

      page: queryResult.page,
      pageSize: queryResult.pageSize,
      totalPages: queryResult.totalPages,

      columns: queryResult.columns,
      rows: queryResult.rows,

      scope,

      exportAdvice,
    };
  } catch (error) {
    rethrowKnownServiceError(error);
  }
}

/**
 * Devuelve las opciones iniciales del configurador de Reportes.
 *
 * Para esta consulta usamos un scope global sin filtros geográficos
 * y permitimos sucursales inactivas, porque precisamente necesitamos
 * que el frontend pueda mostrarlas como opciones.
 *
 * El usuario todavía NO obtiene acceso extra:
 * resolveReportScope() sigue aplicando GERENTE/SUPERADMIN.
 */
export async function getReportOptions(
  user: ReportsAuthUser,
): Promise<ReportOptionsResult> {
  const optionsScope: ReportScopeInput = {
    countryCodes: [],
    regions: [],
    branchIds: [],
    includeInactiveBranches: true,
  };

  try {
    const scope = await resolveReportScope(
      user,
      optionsScope,
    );

    return await getReportOptionsFromScope(
      scope,
    );
  } catch (error) {
    rethrowKnownServiceError(error);
  }
}

/**
 * Genera un PDF descargable usando exactamente la misma definición
 * que alimenta el preview.
 *
 * Flujo:
 * 1. resolver seguridad/alcance;
 * 2. comprobar el límite duro;
 * 3. ejecutar la consulta completa, pero acotada;
 * 4. resolver etiquetas legibles para la configuración;
 * 5. renderizar el documento;
 * 6. devolver buffer + métricas para benchmark.
 */
export async function getReportPdf(
  user: ReportsAuthUser,
  input: ReportPreviewInput,
): Promise<ReportPdfExportResult> {
  const totalStartedAt =
    performance.now();

  const rssBefore =
    process.memoryUsage().rss;

  const generatedAt =
    new Date();

  try {
    const scope =
      await resolveReportScope(
        user,
        input.scope,
      );

    const hardMaxRows =
      requirePdfHardMaxRows();

    const queryStartedAt =
      performance.now();

    const report =
      await queryReportExport(
        input,
        scope,
        hardMaxRows,
      );

    const queryMs =
      performance.now() -
      queryStartedAt;

    const options =
      await getReportOptionsFromScope(
        scope,
      );

    const renderStartedAt =
      performance.now();

    const rendered =
      await renderReportPdf({
        report,
        definition: input,
        scope,
        options,
        generatedAt,
      });

    const renderMs =
      performance.now() -
      renderStartedAt;

    const totalMs =
      performance.now() -
      totalStartedAt;

    const rssAfter =
      process.memoryUsage().rss;

    const metrics: ReportPdfMetrics = {
      rows: report.total,
      columns:
        report.columns.length,
      pages:
        rendered.pageCount,
      bytes:
        rendered.buffer.byteLength,
      queryMs:
        Math.round(queryMs),
      renderMs:
        Math.round(renderMs),
      totalMs:
        Math.round(totalMs),
      rssDeltaBytes:
        rssAfter - rssBefore,
    };

    console.info(
      "[reports/pdf]",
      {
        ...metrics,
        rssDeltaMb:
          Number(
            (
              metrics.rssDeltaBytes /
              1024 /
              1024
            ).toFixed(2),
          ),
      },
    );

    return {
      buffer:
        rendered.buffer,
      filename:
        reportPdfFilename(
          generatedAt,
        ),
      metrics,
    };
  } catch (error) {
    rethrowKnownServiceError(error);
  }
}


/**
 * Genera un Excel descargable con la misma definición, alcance
 * autorizado y motor de consulta del preview/PDF.
 *
 * Excel usa un límite duro independiente cuando
 * REPORT_XLSX_HARD_MAX_ROWS está configurado.
 *
 * Si todavía no existe ese valor, hereda el hard limit de PDF
 * como fallback seguro; nunca queda ilimitado por accidente.
 */
export async function getReportXlsx(
  user: ReportsAuthUser,
  input: ReportPreviewInput,
): Promise<ReportXlsxExportResult> {
  const totalStartedAt =
    performance.now();

  const rssBefore =
    process.memoryUsage().rss;

  const generatedAt =
    new Date();

  try {
    const scope =
      await resolveReportScope(
        user,
        input.scope,
      );

    const hardMaxRows =
      requireXlsxHardMaxRows();

    const queryStartedAt =
      performance.now();

    const report =
      await queryReportExport(
        input,
        scope,
        hardMaxRows,
      );

    const queryMs =
      performance.now() -
      queryStartedAt;

    const options =
      await getReportOptionsFromScope(
        scope,
      );

    const renderStartedAt =
      performance.now();

    const rendered =
      await renderReportXlsx({
        report,
        definition: input,
        scope,
        options,
        generatedAt,
      });

    const renderMs =
      performance.now() -
      renderStartedAt;

    const totalMs =
      performance.now() -
      totalStartedAt;

    const rssAfter =
      process.memoryUsage().rss;

    const metrics: ReportXlsxMetrics = {
      rows: report.total,
      columns:
        report.columns.length,
      worksheets:
        rendered.worksheetCount,
      bytes:
        rendered.buffer.byteLength,
      queryMs:
        Math.round(queryMs),
      renderMs:
        Math.round(renderMs),
      totalMs:
        Math.round(totalMs),
      rssDeltaBytes:
        rssAfter - rssBefore,
    };

    console.info(
      "[reports/xlsx]",
      {
        ...metrics,
        rssDeltaMb:
          Number(
            (
              metrics.rssDeltaBytes /
              1024 /
              1024
            ).toFixed(2),
          ),
      },
    );

    return {
      buffer:
        rendered.buffer,
      filename:
        reportXlsxFilename(
          generatedAt,
        ),
      metrics,
    };
  } catch (error) {
    rethrowKnownServiceError(error);
  }
}
