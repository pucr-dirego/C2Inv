import type {
  Request,
  Response,
} from "express";
import { z } from "zod";

import {
  getReportOptions,
  getReportPdf,
  getReportPreview,
  getReportXlsx,
  ReportsServiceError,
  type ReportsServiceErrorCode,
} from "../services/reports.service.js";

import type {
  ReportColumnKey,
  ReportPreviewInput,
  ReportsAuthUser,
} from "../types/reports.js";

// ======================================================
// VALORES PERMITIDOS EN RUNTIME
// ======================================================

/**
 * TypeScript desaparece al ejecutar JavaScript.
 *
 * Por eso estas listas existen en runtime y Zod puede usarlas
 * para validar lo que realmente llega desde HTTP.
 *
 * `satisfies` hace que TypeScript compruebe que ninguna clave
 * escrita aquí sea incompatible con ReportColumnKey.
 */
const REPORT_COLUMN_VALUES = [
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

/**
 * Esta pequeña comprobación hace fallar TypeScript si algún día
 * agregamos una nueva ReportColumnKey pero olvidamos incorporarla
 * al esquema HTTP del controller.
 */
type MissingReportColumn = Exclude<
  ReportColumnKey,
  (typeof REPORT_COLUMN_VALUES)[number]
>;

const ALL_REPORT_COLUMNS_ARE_VALIDATED:
  MissingReportColumn extends never
    ? true
    : never = true;

void ALL_REPORT_COLUMNS_ARE_VALIDATED;

// ======================================================
// ESQUEMAS ZOD
// ======================================================

const countryCodeSchema =
  z.enum([
    "MX",
    "CO",
  ]);

const regionSchema =
  z
    .object({
      countryCode:
        countryCodeSchema,

      name:
        z
          .string()
          .trim()
          .min(
            1,
            "La región no puede estar vacía.",
          )
          .max(
            120,
            "La región es demasiado larga.",
          ),
    })
    .strict();

const scopeSchema =
  z
    .object({
      countryCodes:
        z
          .array(countryCodeSchema)
          .default([]),

      regions:
        z
          .array(regionSchema)
          .default([]),

      branchIds:
        z
          .array(
            z.string().uuid({
              message:
                "Una de las sucursales no tiene un identificador válido.",
            }),
          )
          .default([]),

      includeInactiveBranches:
        z.boolean().default(false),
    })
    .strict();

const responsibilitySchema =
  z.enum([
    "all",
    "assigned",
    "unassigned",
  ]);

const dataIssueSchema =
  z.enum([
    "missing_responsible",
    "missing_invoice",
    "missing_acquisition_amount",
    "physical_damage",
    "operating_observations",
    "not_operational",
  ]);

const filtersSchema =
  z
    .object({
      equipmentTypeCodes:
        z.array(z.string().trim().min(1)).default([]),

      departmentIds:
        z
          .array(
            z.string().uuid({
              message:
                "Uno de los departamentos no tiene un identificador válido.",
            }),
          )
          .default([]),

      operatingStatusCodes:
        z.array(z.string().trim().min(1)).default([]),

      physicalConditionCodes:
        z.array(z.string().trim().min(1)).default([]),

      incorporationTypeCodes:
        z.array(z.string().trim().min(1)).default([]),

      brands:
        z
          .array(
            z
              .string()
              .trim()
              .min(1)
              .max(120),
          )
          .default([]),

      responsibility:
        responsibilitySchema.default("all"),

      dataIssues:
        z.array(dataIssueSchema).default([]),
    })
    .strict();

const dateOnlySchema =
  z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "La fecha debe utilizar el formato YYYY-MM-DD.",
    );

const dateSchema =
  z
    .object({
      field:
        z.enum([
          "createdAt",
          "updatedAt",
          "deactivatedAt",
          "reactivatedAt",
        ]),

      from:
        dateOnlySchema.optional(),

      to:
        dateOnlySchema.optional(),
    })
    .strict()
    .refine(
      (value) =>
        value.from !== undefined ||
        value.to !== undefined,
      {
        message:
          "El filtro de fecha debe incluir una fecha inicial o final.",
      },
    );

const reportColumnSchema =
  z.enum(REPORT_COLUMN_VALUES);

const columnsSchema =
  z.discriminatedUnion(
    "mode",
    [
      z
        .object({
          mode: z.literal("all"),
        })
        .strict(),

      z
        .object({
          mode: z.literal("selected"),

          values:
            z
              .array(reportColumnSchema)
              .min(
                1,
                "Selecciona al menos una columna para el reporte.",
              ),
        })
        .strict(),
    ],
  );

const groupingSchema =
  z
    .object({
      geographic:
        z.boolean().default(true),

      secondary:
        z
          .enum([
            "equipmentType",
            "department",
            "operatingStatus",
            "physicalCondition",
            "incorporationType",
            "brand",
          ])
          .optional(),
    })
    .strict();

const previewBodySchema =
  z
    .object({
      scope: scopeSchema,

      assetStatus:
        z
          .enum([
            "active",
            "inactive",
            "all",
          ])
          .default("active"),

      filters: filtersSchema,

      date: dateSchema.optional(),

      columns: columnsSchema,

      grouping: groupingSchema,

      page:
        z
          .number()
          .int()
          .positive()
          .optional(),

      pageSize:
        z
          .number()
          .int()
          .positive()
          .optional(),
    })
    .strict();

// ======================================================
// CONTEXTO DE AUTENTICACIÓN
// ======================================================

function getAuthUser(
  res: Response,
): ReportsAuthUser | null {
  const user =
    res.locals.authUser as
      | ReportsAuthUser
      | undefined;

  if (!user) {
    res.status(401).json({
      ok: false,
      code: "UNAUTHENTICATED",
      message:
        "Necesitas iniciar sesión para utilizar Reportes.",
    });

    return null;
  }

  return user;
}

// ======================================================
// ERRORES
// ======================================================

function getHttpStatusForReportsError(
  code: ReportsServiceErrorCode,
): number {
  switch (code) {
    case "FORBIDDEN":
    case "MANAGER_BRANCH_CONFIGURATION":
    case "BRANCH_NOT_ALLOWED":
      return 403;

    case "BRANCH_NOT_FOUND":
    case "INVALID_SCOPE":
    case "UNSUPPORTED_BRANCH_COUNTRY":
    case "INVALID_COLUMN":
    case "INVALID_DATE_FILTER":
      return 400;

    case "EXPORT_LIMIT_EXCEEDED":
      return 413;

    case "REPORTS_CONFIGURATION_ERROR":
      return 500;
  }
}

function handleReportsError(
  error: unknown,
  res: Response,
): boolean {
  if (!(error instanceof ReportsServiceError)) {
    return false;
  }

  res
    .status(
      getHttpStatusForReportsError(
        error.code,
      ),
    )
    .json({
      ok: false,
      code: error.code,
      message: error.message,
    });

  return true;
}



// ======================================================
// GET /api/reports/options
// ======================================================

/**
 * Entrega al frontend las opciones dinámicas necesarias para
 * construir el "fast food" de Reportes:
 *
 * - países;
 * - regiones;
 * - sucursales;
 * - tipos de equipo;
 * - departamentos;
 * - estados;
 * - condiciones;
 * - incorporaciones;
 * - marcas.
 *
 * El alcance ya respeta los permisos del usuario.
 */
export async function options(
  _req: Request,
  res: Response,
): Promise<void> {
  const user = getAuthUser(res);

  if (!user) {
    return;
  }

  try {
    const data =
      await getReportOptions(
        user,
      );

    res.status(200).json({
      ok: true,
      data,
    });
  } catch (error) {
    if (
      handleReportsError(
        error,
        res,
      )
    ) {
      return;
    }

    console.error(
      "Error obteniendo opciones de Reportes:",
      error,
    );

    res.status(500).json({
      ok: false,
      code: "REPORT_OPTIONS_FAILED",
      message:
        "No fue posible cargar las opciones de Reportes.",
    });
  }
}

// ======================================================
// POST /api/reports/preview
// ======================================================

/**
 * Recibe la configuración del generador de Reportes,
 * valida el contrato HTTP y delega la lógica de negocio
 * al servicio orquestador.
 *
 * El controller NO construye SQL ni decide permisos por
 * sucursal.
 */
export async function preview(
  req: Request,
  res: Response,
): Promise<void> {
  const user = getAuthUser(res);

  if (!user) {
    return;
  }

  const parsed =
    previewBodySchema.safeParse(
      req.body,
    );

  if (!parsed.success) {
    res.status(400).json({
      ok: false,
      code: "INVALID_REPORT_REQUEST",
      message:
        "La configuración del reporte no es válida.",

      issues:
        parsed.error.issues.map(
          (issue) => ({
            path:
              issue.path.join("."),
            message:
              issue.message,
          }),
        ),
    });

    return;
  }

  /**
   * Esta asignación hace que TypeScript compruebe que lo que
   * produce el esquema Zod siga siendo compatible con nuestro
   * contrato de dominio.
   */
  const input: ReportPreviewInput =
    parsed.data;

  try {
    const data =
      await getReportPreview(
        user,
        input,
      );

    res.status(200).json({
      ok: true,
      data,
    });
  } catch (error) {
    if (
      handleReportsError(
        error,
        res,
      )
    ) {
      return;
    }

    console.error(
      "Error generando preview de Reportes:",
      error,
    );

    res.status(500).json({
      ok: false,
      code: "REPORT_PREVIEW_FAILED",
      message:
        "No fue posible generar la vista previa del reporte.",
    });
  }
}

// ======================================================
// POST /api/reports/export/pdf
// ======================================================

/**
 * Genera el PDF en backend y lo entrega como attachment.
 *
 * Recibe la misma definición que /preview para garantizar que
 * el usuario exporte exactamente la configuración que está viendo.
 */
export async function exportPdf(
  req: Request,
  res: Response,
): Promise<void> {
  const user = getAuthUser(res);

  if (!user) {
    return;
  }

  const parsed =
    previewBodySchema.safeParse(
      req.body,
    );

  if (!parsed.success) {
    res.status(400).json({
      ok: false,
      code:
        "INVALID_REPORT_REQUEST",
      message:
        "La configuración del reporte no es válida.",

      issues:
        parsed.error.issues.map(
          (issue) => ({
            path:
              issue.path.join("."),
            message:
              issue.message,
          }),
        ),
    });

    return;
  }

  const input: ReportPreviewInput =
    parsed.data;

  try {
    const result =
      await getReportPdf(
        user,
        input,
      );

    res.setHeader(
      "Content-Type",
      "application/pdf",
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.filename}"`,
    );

    res.setHeader(
      "Content-Length",
      String(
        result.buffer.byteLength,
      ),
    );

    res.setHeader(
      "Cache-Control",
      "private, no-store",
    );

    /**
     * Estas cabeceras son útiles durante el benchmark.
     * No contienen datos sensibles del inventario.
     */
    res.setHeader(
      "X-Report-Rows",
      String(
        result.metrics.rows,
      ),
    );

    res.setHeader(
      "X-Report-Columns",
      String(
        result.metrics.columns,
      ),
    );

    res.setHeader(
      "X-Report-Pages",
      String(
        result.metrics.pages,
      ),
    );

    res.setHeader(
      "X-Report-Generation-Ms",
      String(
        result.metrics.totalMs,
      ),
    );

    res.status(200).send(
      result.buffer,
    );
  } catch (error) {
    if (
      handleReportsError(
        error,
        res,
      )
    ) {
      return;
    }

    console.error(
      "Error generando PDF de Reportes:",
      error,
    );

    res.status(500).json({
      ok: false,
      code:
        "REPORT_PDF_FAILED",
      message:
        "No fue posible generar el PDF del reporte.",
    });
  }
}


// ======================================================
// POST /api/reports/export/xlsx
// ======================================================

/**
 * Genera un archivo Excel en backend.
 *
 * El body es exactamente el mismo contrato que preview/PDF:
 * no recibimos filas desde el navegador; recibimos la definición
 * del reporte y el backend vuelve a resolver permisos + datos.
 */
export async function exportXlsx(
  req: Request,
  res: Response,
): Promise<void> {
  const user = getAuthUser(res);

  if (!user) {
    return;
  }

  const parsed =
    previewBodySchema.safeParse(
      req.body,
    );

  if (!parsed.success) {
    res.status(400).json({
      ok: false,
      code:
        "INVALID_REPORT_REQUEST",
      message:
        "La configuración del reporte no es válida.",

      issues:
        parsed.error.issues.map(
          (issue) => ({
            path:
              issue.path.join("."),
            message:
              issue.message,
          }),
        ),
    });

    return;
  }

  const input: ReportPreviewInput =
    parsed.data;

  try {
    const result =
      await getReportXlsx(
        user,
        input,
      );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.filename}"`,
    );

    res.setHeader(
      "Content-Length",
      String(
        result.buffer.byteLength,
      ),
    );

    res.setHeader(
      "Cache-Control",
      "private, no-store",
    );

    res.setHeader(
      "X-Report-Rows",
      String(
        result.metrics.rows,
      ),
    );

    res.setHeader(
      "X-Report-Columns",
      String(
        result.metrics.columns,
      ),
    );

    res.setHeader(
      "X-Report-Sheets",
      String(
        result.metrics.worksheets,
      ),
    );

    res.setHeader(
      "X-Report-Generation-Ms",
      String(
        result.metrics.totalMs,
      ),
    );

    res.status(200).send(
      result.buffer,
    );
  } catch (error) {
    if (
      handleReportsError(
        error,
        res,
      )
    ) {
      return;
    }

    console.error(
      "Error generando Excel de Reportes:",
      error,
    );

    res.status(500).json({
      ok: false,
      code:
        "REPORT_XLSX_FAILED",
      message:
        "No fue posible generar el archivo Excel del reporte.",
    });
  }
}
