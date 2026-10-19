
import type {
  ReportExportFormat,
  ReportOptionsResult,
  ReportPreviewInput,
  ReportPreviewResult,
} from "../types/reports.types";

const API_BASE =
  import.meta.env.VITE_API_URL?.replace(
    /\/$/,
    "",
  ) ?? "http://localhost:3002";

interface ApiEnvelope<T> {
  ok: true;
  data: T;
}

interface ApiErrorBody {
  ok?: false;
  code?: string;
  message?: string;
  issues?: Array<{
    path: string;
    message: string;
  }>;
}

export class ReportsApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly issues: ApiErrorBody["issues"];

  constructor(
    message: string,
    status: number,
    code?: string,
    issues?: ApiErrorBody["issues"],
  ) {
    super(message);
    this.name = "ReportsApiError";
    this.status = status;
    this.code = code;
    this.issues = issues;
  }
}

async function parseApiError(
  response: Response,
  fallbackMessage: string,
): Promise<ReportsApiError> {
  const body = await response
    .json()
    .catch(() => null) as
      | ApiErrorBody
      | null;

  return new ReportsApiError(
    body?.message ??
      fallbackMessage,
    response.status,
    body?.code,
    body?.issues,
  );
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(
    `${API_BASE}${path}`,
    {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type":
          "application/json",
        Accept:
          "application/json",
        ...(options.headers ?? {}),
      },
    },
  );

  const body = await response
    .json()
    .catch(() => null) as
      | ApiEnvelope<T>
      | ApiErrorBody
      | null;

  if (!response.ok) {
    const errorBody =
      body as ApiErrorBody | null;

    throw new ReportsApiError(
      errorBody?.message ??
        "No fue posible completar la operación de Reportes.",
      response.status,
      errorBody?.code,
      errorBody?.issues,
    );
  }

  if (
    !body ||
    !("data" in body)
  ) {
    throw new ReportsApiError(
      "El servidor devolvió una respuesta incompleta.",
      response.status,
      "INVALID_RESPONSE",
    );
  }

  return body.data;
}

export function getReportOptions(
  signal?: AbortSignal,
) {
  return request<ReportOptionsResult>(
    "/api/reports/options",
    {
      method: "GET",
      signal,
    },
  );
}

export function getReportPreview(
  input: ReportPreviewInput,
  signal?: AbortSignal,
) {
  return request<ReportPreviewResult>(
    "/api/reports/preview",
    {
      method: "POST",
      body: JSON.stringify(input),
      signal,
    },
  );
}

// ======================================================
// EXPORTACIONES BINARIAS
// ======================================================

export interface ReportDownloadMetrics {
  rows: number | null;
  columns: number | null;
  pages: number | null;
  sheets: number | null;
  generationMs: number | null;
}

export interface ReportFileDownload {
  blob: Blob;
  filename: string;
  format: ReportExportFormat;
  metrics: ReportDownloadMetrics;
}

const EXPORT_CONFIG: Record<
  ReportExportFormat,
  {
    path: string;
    accept: string;
    extension: string;
    fallbackMessage: string;
  }
> = {
  pdf: {
    path: "/api/reports/export/pdf",
    accept: "application/pdf",
    extension: "pdf",
    fallbackMessage:
      "No fue posible generar el PDF del reporte.",
  },

  xlsx: {
    path: "/api/reports/export/xlsx",
    accept:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    extension: "xlsx",
    fallbackMessage:
      "No fue posible generar el archivo Excel del reporte.",
  },
};

export async function downloadReportFile(
  format: ReportExportFormat,
  input: ReportPreviewInput,
  signal?: AbortSignal,
): Promise<ReportFileDownload> {
  const config =
    EXPORT_CONFIG[format];

  const response = await fetch(
    `${API_BASE}${config.path}`,
    {
      method: "POST",
      credentials: "include",
      signal,
      headers: {
        "Content-Type":
          "application/json",
        Accept:
          config.accept,
      },
      body: JSON.stringify(input),
    },
  );

  if (!response.ok) {
    throw await parseApiError(
      response,
      config.fallbackMessage,
    );
  }

  const contentType =
    response.headers.get(
      "Content-Type",
    ) ?? "";

  if (
    !contentType
      .toLowerCase()
      .includes(
        config.accept.toLowerCase(),
      )
  ) {
    throw new ReportsApiError(
      `El servidor no devolvió un archivo ${format.toUpperCase()} válido.`,
      response.status,
      "INVALID_EXPORT_RESPONSE",
    );
  }

  const blob =
    await response.blob();

  if (blob.size === 0) {
    throw new ReportsApiError(
      "El servidor devolvió un archivo vacío.",
      response.status,
      "EMPTY_EXPORT",
    );
  }

  const disposition =
    response.headers.get(
      "Content-Disposition",
    );

  const filename =
    getFilenameFromDisposition(
      disposition,
    ) ??
    makeFallbackFilename(
      config.extension,
    );

  return {
    blob,
    filename,
    format,
    metrics: {
      rows:
        readNumberHeader(
          response,
          "X-Report-Rows",
        ),
      columns:
        readNumberHeader(
          response,
          "X-Report-Columns",
        ),
      pages:
        readNumberHeader(
          response,
          "X-Report-Pages",
        ),
      sheets:
        readNumberHeader(
          response,
          "X-Report-Sheets",
        ),
      generationMs:
        readNumberHeader(
          response,
          "X-Report-Generation-Ms",
        ),
    },
  };
}

function readNumberHeader(
  response: Response,
  name: string,
): number | null {
  const raw =
    response.headers.get(name);

  if (!raw) {
    return null;
  }

  const value = Number(raw);

  return Number.isFinite(value)
    ? value
    : null;
}

function getFilenameFromDisposition(
  disposition: string | null,
): string | null {
  if (!disposition) {
    return null;
  }

  const utf8Match =
    disposition.match(
      /filename\*=UTF-8''([^;]+)/i,
    );

  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(
        utf8Match[1]
          .replace(/^["']|["']$/g, ""),
      );
    } catch {
      // Continuamos con filename normal.
    }
  }

  const normalMatch =
    disposition.match(
      /filename="?([^";]+)"?/i,
    );

  return normalMatch?.[1]?.trim() ??
    null;
}

function makeFallbackFilename(
  extension: string,
) {
  const now = new Date();

  const parts = [
    now.getFullYear(),
    String(
      now.getMonth() + 1,
    ).padStart(2, "0"),
    String(
      now.getDate(),
    ).padStart(2, "0"),
    "-",
    String(
      now.getHours(),
    ).padStart(2, "0"),
    String(
      now.getMinutes(),
    ).padStart(2, "0"),
  ];

  return `inventarios-ti-reporte-${parts.join("")}.${extension}`;
}

/**
 * Descarga un Blob sin navegar fuera de la aplicación.
 */
export function saveReportFile(
  download: ReportFileDownload,
): void {
  const objectUrl =
    URL.createObjectURL(
      download.blob,
    );

  const anchor =
    document.createElement("a");

  anchor.href = objectUrl;
  anchor.download =
    download.filename;

  document.body.appendChild(
    anchor,
  );

  anchor.click();
  anchor.remove();

  window.setTimeout(
    () => {
      URL.revokeObjectURL(
        objectUrl,
      );
    },
    1_000,
  );
}
