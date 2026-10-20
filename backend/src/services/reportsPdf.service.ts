import PDFDocument from "pdfkit";

import type {
  ReportColumnKey,
  ReportDataIssueKey,
  ReportDateField,
  ReportOptionsResult,
  ReportPreviewInput,
  ReportPreviewRow,
  ReportSecondaryGrouping,
  ResolvedReportScope,
} from "../types/reports.js";

import type {
  ReportExportQueryResult,
} from "./reportsQuery.service.js";

// ======================================================
// CONTRATO DEL RENDER
// ======================================================

export interface ReportPdfRenderInput {
  report: ReportExportQueryResult;
  definition: ReportPreviewInput;
  scope: ResolvedReportScope;
  options: ReportOptionsResult;
  generatedAt: Date;
}

export interface ReportPdfRenderResult {
  buffer: Buffer;
  pageCount: number;
}

// ======================================================
// PRESENTACIÓN
// ======================================================

const COLORS = {
  ink: "#171A1F",
  text: "#2A2F36",
  secondary: "#5F6670",
  tertiary: "#8A9099",
  line: "#D9DDE3",
  lineStrong: "#C7CDD5",
  panel: "#F5F6F8",
  panelStrong: "#ECEFF3",
  rowAlt: "#FAFBFC",
  navy: "#1F3A5F",
  navyDark: "#14263D",
  navySoft: "#EEF3F8",
  inactiveSoft: "#F0F1F3",
  amber: "#8A5400",
  amberSoft: "#FFF7E8",
  white: "#FFFFFF",
} as const;

const PAGE = {
  marginLeft: 38,
  marginRight: 38,
  marginTop: 28,
  marginBottom: 34,
  footerHeight: 18,
} as const;

const TABLE = {
  headerHeight: 26,
  minRowHeight: 21,
  maxRowHeight: 36,
  groupHeight: 23,
  inactiveSectionHeight: 29,
  cellPaddingX: 6,
  cellPaddingY: 4,
  bodyFontSize: 7.1,
  headerFontSize: 6.6,
  maxColumnsPerBand: 10,
} as const;

const COLUMN_LABELS: Record<
  ReportColumnKey,
  string
> = {
  inventoryNumber: "Núm. inventario",
  equipmentType: "Tipo",
  brand: "Marca",
  model: "Modelo",
  serialNumber: "Núm. serie",
  hostname: "Hostname",
  ipAddress: "IP",
  operatingSystem: "Sistema operativo",
  anydesk: "AnyDesk",
  country: "País",
  region: "Región",
  branch: "Sucursal",
  branchStatus: "Estado sucursal",
  department: "Departamento",
  responsible: "Responsable",
  exactLocation: "Ubicación",
  operatingStatus: "Funcionamiento",
  physicalCondition: "Condición física",
  incorporationType: "Incorporación",
  observations: "Observaciones",
  invoiceNumber: "Núm. factura",
  invoiceDate: "Fecha factura",
  invoiceSupplier: "Proveedor",
  invoiceBusinessName: "Razón social",
  invoiceCurrency: "Moneda",
  invoiceTotal: "Total factura",
  invoiceItem: "Partida factura",
  acquisitionAmount: "Importe adquisición",
  assetStatus: "Estado activo",
  createdAt: "Fecha alta",
  updatedAt: "Actualización",
  deactivatedAt: "Fecha baja",
  deactivationReason: "Motivo de baja",
  deactivationDetail: "Detalle de baja",
  reactivatedAt: "Reactivación",
};

const COLUMN_WEIGHT: Partial<
  Record<ReportColumnKey, number>
> = {
  inventoryNumber: 1.2,
  equipmentType: 1.15,
  brand: 1,
  model: 1.25,
  serialNumber: 1.35,
  operatingSystem: 1.45,
  country: 0.95,
  region: 1.1,
  branch: 1.35,
  department: 1.25,
  responsible: 1.35,
  exactLocation: 1.6,
  operatingStatus: 1.25,
  physicalCondition: 1.25,
  incorporationType: 1.25,
  observations: 1.9,
  invoiceSupplier: 1.4,
  invoiceBusinessName: 1.5,
  deactivationReason: 1.35,
  deactivationDetail: 1.8,
};

const DATA_ISSUE_LABELS: Record<
  ReportDataIssueKey,
  string
> = {
  missing_responsible:
    "Sin responsable",
  missing_invoice:
    "Factura pendiente",
  missing_acquisition_amount:
    "Sin importe de adquisición",
  physical_damage:
    "Daño físico",
  operating_observations:
    "Operativo con observaciones",
  not_operational:
    "No operativo",
};

const DATE_FIELD_LABELS: Record<
  ReportDateField,
  string
> = {
  createdAt: "Fecha de alta",
  updatedAt: "Última actualización",
  deactivatedAt: "Fecha de baja",
  reactivatedAt: "Fecha de reactivación",
};

const SECONDARY_GROUP_LABELS: Record<
  ReportSecondaryGrouping,
  string
> = {
  equipmentType: "Tipo de equipo",
  department: "Departamento",
  operatingStatus: "Funcionamiento",
  physicalCondition: "Condición física",
  incorporationType: "Incorporación",
  brand: "Marca",
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
// HELPERS DE TEXTO
// ======================================================

function asText(
  value: unknown,
): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "-";
  }

  if (typeof value === "boolean") {
    return value ? "Sí" : "No";
  }

  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T/.test(value)
  ) {
    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat(
        "es-MX",
        {
          dateStyle: "medium",
        },
      ).format(date);
    }
  }

  return String(value);
}

function formatDateTime(
  value: Date,
): string {
  return new Intl.DateTimeFormat(
    "es-MX",
    {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone:
        process.env.REPORT_TIME_ZONE ??
        "America/Monterrey",
    },
  ).format(value);
}

function unique<T>(
  values: T[],
): T[] {
  return [...new Set(values)];
}

function mapCatalogCodes(
  selected: string[],
  options: Array<{
    code: string;
    name: string;
  }>,
): string[] {
  const map = new Map(
    options.map(
      (item) => [
        item.code,
        item.name,
      ],
    ),
  );

  return selected.map(
    (value) =>
      map.get(value) ?? value,
  );
}

function mapCatalogIds(
  selected: string[],
  options: Array<{
    id: string;
    name: string;
  }>,
): string[] {
  const map = new Map(
    options.map(
      (item) => [
        item.id,
        item.name,
      ],
    ),
  );

  return selected.map(
    (value) =>
      map.get(value) ?? value,
  );
}

function summarizeList(
  label: string,
  values: string[],
): string | null {
  if (values.length === 0) {
    return null;
  }

  const visible =
    values.slice(0, 4);

  const extra =
    values.length -
    visible.length;

  return `${label}: ${visible.join(", ")}${extra > 0 ? ` +${extra}` : ""}`;
}

function assetStatusLabel(
  value: ReportPreviewInput["assetStatus"],
): string {
  switch (value) {
    case "active":
      return "Activos";
    case "inactive":
      return "Inactivos";
    default:
      return "Activos e inactivos";
  }
}

function scopeSummary(
  input: ReportPdfRenderInput,
): string {
  const branches = input.scope.branches;

  if (branches.length === 0) {
    return "Sin sucursales";
  }

  if (branches.length === 1) {
    return branches[0]?.nombre ?? "1 sucursal";
  }

  if (
    input.definition.scope.branchIds.length === 0 &&
    input.definition.scope.regions.length === 0
  ) {
    return `${branches.length} sucursales`;
  }

  return `${branches.length} sucursales seleccionadas`;
}

function splitConfigurationLine(
  line: string,
): { label: string; value: string } {
  const separator = line.indexOf(":");

  if (separator === -1) {
    return { label: "Criterio", value: line };
  }

  return {
    label: line.slice(0, separator).trim(),
    value: line.slice(separator + 1).trim(),
  };
}

// ======================================================
// RESUMEN DE CONFIGURACIÓN
// ======================================================

function buildConfigurationLines(
  input: ReportPreviewInput,
  options: ReportOptionsResult,
): string[] {
  const lines: Array<
    string | null
  > = [];

  const countryMap =
    new Map(
      options.scope.countries.map(
        (country) => [
          country.code,
          country.label,
        ],
      ),
    );

  const branchMap =
    new Map(
      options.scope.branches.map(
        (branch) => [
          branch.id,
          branch.nombre,
        ],
      ),
    );

  lines.push(
    summarizeList(
      "País",
      input.scope.countryCodes.map(
        (code) =>
          countryMap.get(code) ??
          code,
      ),
    ),
  );

  lines.push(
    summarizeList(
      "Región",
      input.scope.regions.map(
        (region) =>
          `${region.name} (${region.countryCode})`,
      ),
    ),
  );

  lines.push(
    summarizeList(
      "Sucursal",
      input.scope.branchIds.map(
        (id) =>
          branchMap.get(id) ??
          id,
      ),
    ),
  );

  lines.push(
    `Equipos: ${assetStatusLabel(input.assetStatus)}`,
  );

  lines.push(
    `Sucursales inactivas: ${
      input.scope.includeInactiveBranches
        ? "Incluidas"
        : "No incluidas"
    }`,
  );

  lines.push(
    summarizeList(
      "Tipo",
      mapCatalogCodes(
        input.filters.equipmentTypeCodes,
        options.filters.equipmentTypes,
      ),
    ),
  );

  lines.push(
    summarizeList(
      "Departamento",
      mapCatalogIds(
        input.filters.departmentIds,
        options.filters.departments,
      ),
    ),
  );

  lines.push(
    summarizeList(
      "Funcionamiento",
      mapCatalogCodes(
        input.filters.operatingStatusCodes,
        options.filters.operatingStatuses,
      ),
    ),
  );

  lines.push(
    summarizeList(
      "Condición física",
      mapCatalogCodes(
        input.filters.physicalConditionCodes,
        options.filters.physicalConditions,
      ),
    ),
  );

  lines.push(
    summarizeList(
      "Incorporación",
      mapCatalogCodes(
        input.filters.incorporationTypeCodes,
        options.filters.incorporationTypes,
      ),
    ),
  );

  lines.push(
    summarizeList(
      "Marca",
      input.filters.brands,
    ),
  );

  if (
    input.filters.responsibility !==
    "all"
  ) {
    lines.push(
      `Responsable: ${
        input.filters.responsibility ===
        "assigned"
          ? "Asignados"
          : "Sin asignar"
      }`,
    );
  }

  lines.push(
    summarizeList(
      "Atención",
      input.filters.dataIssues.map(
        (key) =>
          DATA_ISSUE_LABELS[key],
      ),
    ),
  );

  if (input.date) {
    lines.push(
      `${DATE_FIELD_LABELS[input.date.field]}: ${input.date.from ?? "..."} a ${input.date.to ?? "..."}`,
    );
  }

  lines.push(
    `Agrupacion: ${
      input.grouping.geographic
        ? "País / Región / Sucursal"
        : "Sin agrupación geográfica"
    }${
      input.grouping.secondary
        ? ` + ${SECONDARY_GROUP_LABELS[input.grouping.secondary]}`
        : ""
    }`,
  );

  return lines.filter(
    (
      line,
    ): line is string =>
      Boolean(line),
  );
}

// ======================================================
// BANDAS DE COLUMNAS
// ======================================================

function splitColumnsIntoBands(
  columns: ReportColumnKey[],
): ReportColumnKey[][] {
  if (
    columns.length <=
    TABLE.maxColumnsPerBand
  ) {
    return [columns];
  }

  const identity:
    | ReportColumnKey
    | null =
      columns.includes(
        "inventoryNumber",
      )
        ? "inventoryNumber"
        : null;

  const remaining =
    columns.filter(
      (column) =>
        column !== identity,
    );

  const chunkSize =
    identity
      ? TABLE.maxColumnsPerBand - 1
      : TABLE.maxColumnsPerBand;

  const bands:
    ReportColumnKey[][] = [];

  for (
    let index = 0;
    index < remaining.length;
    index += chunkSize
  ) {
    const chunk =
      remaining.slice(
        index,
        index + chunkSize,
      );

    bands.push(
      identity
        ? [identity, ...chunk]
        : chunk,
    );
  }

  return bands.length > 0
    ? bands
    : [columns];
}

function columnWidths(
  columns: ReportColumnKey[],
  availableWidth: number,
): number[] {
  const weights =
    columns.map(
      (column) =>
        COLUMN_WEIGHT[column] ??
        1,
    );

  const total =
    weights.reduce(
      (sum, value) =>
        sum + value,
      0,
    );

  return weights.map(
    (weight) =>
      availableWidth *
      (weight / total),
  );
}

// ======================================================
// AGRUPACIÓN
// ======================================================

interface GroupInfo {
  key: string;
  title: string;
  inactive: boolean;
}

function groupInfo(
  row: ReportPreviewRow,
  input: ReportPreviewInput,
): GroupInfo | null {
  const secondary =
    input.grouping.secondary;

  const secondaryText =
    secondary
      ? `${SECONDARY_GROUP_LABELS[secondary]}: ${asText(
          row[
            SECONDARY_GROUP_COLUMN[
              secondary
            ]
          ],
        )}`
      : null;

  if (
    input.grouping.geographic
  ) {
    const country =
      asText(row.country);

    const region =
      asText(row.region);

    const branch =
      asText(row.branch);

    const inactive =
      asText(
        row.branchStatus,
      ) === "Inactiva";

    const unknown =
      country ===
        "Ubicación no configurada" ||
      region ===
        "Ubicación no configurada" ||
      country ===
        "Ubicacion no configurada" ||
      region ===
        "Ubicacion no configurada";

    const geographicTitle =
      unknown
        ? `Ubicación no configurada / ${branch}`
        : `${country} / ${region} / ${branch}`;

    const title =
      secondaryText
        ? `${geographicTitle} / ${secondaryText}`
        : geographicTitle;

    return {
      key:
        `${inactive ? "inactive" : "active"}::${title}`,
      title,
      inactive,
    };
  }

  if (secondaryText) {
    return {
      key: secondaryText,
      title: secondaryText,
      inactive: false,
    };
  }

  return null;
}

// ======================================================
// DIBUJO
// ======================================================

function availableTableWidth(
  doc: PDFKit.PDFDocument,
): number {
  return (
    doc.page.width -
    PAGE.marginLeft -
    PAGE.marginRight
  );
}

function pageBottom(
  doc: PDFKit.PDFDocument,
): number {
  return (
    doc.page.height -
    PAGE.marginBottom -
    PAGE.footerHeight
  );
}

function drawRunningHeader(
  doc: PDFKit.PDFDocument,
  bandIndex: number,
  bandCount: number,
): number {
  const y = PAGE.marginTop;
  const rightX = doc.page.width - PAGE.marginRight - 170;

  doc
    .font("Helvetica-Bold")
    .fontSize(7.2)
    .fillColor(COLORS.navyDark)
    .text(
      "SISTEMA DE INVENTARIOS TI",
      PAGE.marginLeft,
      y,
      {
        characterSpacing: 0.55,
        lineBreak: false,
      },
    );

  doc
    .font("Helvetica")
    .fontSize(7)
    .fillColor(COLORS.secondary)
    .text(
      "Informe de inventario",
      PAGE.marginLeft,
      y + 12,
      { lineBreak: false },
    );

  const bandLabel =
    bandCount > 1
      ? bandIndex === 0
        ? `Datos generales · Bloque 1 de ${bandCount}`
        : `Datos complementarios · Bloque ${bandIndex + 1} de ${bandCount}`
      : "Detalle del inventario";

  doc
    .font("Helvetica")
    .fontSize(6.8)
    .fillColor(COLORS.tertiary)
    .text(
      bandLabel,
      rightX,
      y + 2,
      {
        width: 170,
        align: "right",
        lineBreak: false,
      },
    );

  if (bandCount > 1 && bandIndex > 0) {
    doc
      .font("Helvetica")
      .fontSize(5.9)
      .fillColor(COLORS.secondary)
      .text(
        "Mismos equipos · no son registros adicionales",
        rightX,
        y + 13,
        {
          width: 170,
          align: "right",
          lineBreak: false,
        },
      );
  }

  const lineY = y + 26;

  doc
    .strokeColor(COLORS.lineStrong)
    .lineWidth(0.7)
    .moveTo(PAGE.marginLeft, lineY)
    .lineTo(doc.page.width - PAGE.marginRight, lineY)
    .stroke();

  return lineY + 10;
}

function drawTableHeader(
  doc: PDFKit.PDFDocument,
  columns: ReportColumnKey[],
  widths: number[],
  y: number,
): number {
  let x = PAGE.marginLeft;

  doc
    .save()
    .fillColor(COLORS.navyDark)
    .rect(
      PAGE.marginLeft,
      y,
      availableTableWidth(doc),
      TABLE.headerHeight,
    )
    .fill()
    .restore();

  columns.forEach((column, index) => {
    const width = widths[index] ?? 80;

    doc
      .font("Helvetica-Bold")
      .fontSize(TABLE.headerFontSize)
      .fillColor(COLORS.white)
      .text(
        COLUMN_LABELS[column].toUpperCase(),
        x + TABLE.cellPaddingX,
        y + 9,
        {
          width: width - TABLE.cellPaddingX * 2,
          height: 10,
          ellipsis: true,
          lineBreak: false,
          characterSpacing: 0.15,
        },
      );

    if (index < columns.length - 1) {
      doc
        .strokeColor("#41536A")
        .lineWidth(0.35)
        .moveTo(x + width, y + 5)
        .lineTo(x + width, y + TABLE.headerHeight - 5)
        .stroke();
    }

    x += width;
  });

  return y + TABLE.headerHeight;
}

function measureRowHeight(
  doc: PDFKit.PDFDocument,
  row: ReportPreviewRow,
  columns: ReportColumnKey[],
  widths: number[],
): number {
  let height: number =
    TABLE.minRowHeight;

  columns.forEach(
    (column, index) => {
      const width =
        widths[index] ?? 80;

      const text =
        asText(row[column]);

      const measured =
        doc
          .font("Helvetica")
          .fontSize(
            TABLE.bodyFontSize,
          )
          .heightOfString(
            text,
            {
              width:
                width -
                TABLE.cellPaddingX *
                  2,
              lineGap: 1,
            },
          ) +
        TABLE.cellPaddingY * 2;

      height =
        Math.max(
          height,
          Math.min(
            measured,
            TABLE.maxRowHeight,
          ),
        );
    },
  );

  return height;
}

function drawRow(
  doc: PDFKit.PDFDocument,
  row: ReportPreviewRow,
  columns: ReportColumnKey[],
  widths: number[],
  y: number,
  rowIndex: number,
): number {
  const rowHeight = measureRowHeight(
    doc,
    row,
    columns,
    widths,
  );

  if (rowIndex % 2 === 1) {
    doc
      .save()
      .fillColor(COLORS.rowAlt)
      .rect(
        PAGE.marginLeft,
        y,
        availableTableWidth(doc),
        rowHeight,
      )
      .fill()
      .restore();
  }

  let x = PAGE.marginLeft;

  columns.forEach((column, index) => {
    const width = widths[index] ?? 80;

    doc
      .font(
        column === "inventoryNumber"
          ? "Helvetica-Bold"
          : "Helvetica",
      )
      .fontSize(TABLE.bodyFontSize)
      .fillColor(
        column === "inventoryNumber"
          ? COLORS.ink
          : COLORS.text,
      )
      .text(
        asText(row[column]),
        x + TABLE.cellPaddingX,
        y + TABLE.cellPaddingY + 1,
        {
          width: width - TABLE.cellPaddingX * 2,
          height: rowHeight - TABLE.cellPaddingY * 2,
          ellipsis: true,
          lineGap: 1,
        },
      );

    if (index < columns.length - 1) {
      doc
        .strokeColor("#EEF0F3")
        .lineWidth(0.3)
        .moveTo(x + width, y + 3)
        .lineTo(x + width, y + rowHeight - 3)
        .stroke();
    }

    x += width;
  });

  doc
    .strokeColor(COLORS.line)
    .lineWidth(0.35)
    .moveTo(PAGE.marginLeft, y + rowHeight)
    .lineTo(doc.page.width - PAGE.marginRight, y + rowHeight)
    .stroke();

  return y + rowHeight;
}

function drawGroupHeader(
  doc: PDFKit.PDFDocument,
  title: string,
  inactive: boolean,
  y: number,
): number {
  doc
    .save()
    .fillColor(
      inactive
        ? COLORS.inactiveSoft
        : COLORS.navySoft,
    )
    .rect(
      PAGE.marginLeft,
      y,
      availableTableWidth(doc),
      TABLE.groupHeight,
    )
    .fill()
    .restore();

  doc
    .save()
    .fillColor(
      inactive
        ? COLORS.tertiary
        : COLORS.navy,
    )
    .rect(PAGE.marginLeft, y, 3, TABLE.groupHeight)
    .fill()
    .restore();

  doc
    .font("Helvetica-Bold")
    .fontSize(7.2)
    .fillColor(
      inactive
        ? COLORS.secondary
        : COLORS.navyDark,
    )
    .text(
      title,
      PAGE.marginLeft + 9,
      y + 7.5,
      {
        width: availableTableWidth(doc) - 16,
        height: 10,
        ellipsis: true,
        lineBreak: false,
      },
    );

  return y + TABLE.groupHeight;
}

function drawInactiveSection(
  doc: PDFKit.PDFDocument,
  y: number,
): number {
  doc
    .strokeColor(COLORS.lineStrong)
    .lineWidth(0.7)
    .moveTo(PAGE.marginLeft, y + 3)
    .lineTo(doc.page.width - PAGE.marginRight, y + 3)
    .stroke();

  doc
    .font("Helvetica-Bold")
    .fontSize(8.4)
    .fillColor(COLORS.secondary)
    .text(
      "SUCURSALES INACTIVAS",
      PAGE.marginLeft,
      y + 10,
      { characterSpacing: 0.5 },
    );

  return y + TABLE.inactiveSectionHeight;
}

function drawCoverHeader(
  doc: PDFKit.PDFDocument,
  input: ReportPdfRenderInput,
  bandCount: number,
): number {
  let y = PAGE.marginTop;
  const width = availableTableWidth(doc);

  // Encabezado institucional
  doc
    .font("Helvetica-Bold")
    .fontSize(7.4)
    .fillColor(COLORS.navyDark)
    .text(
      "SISTEMA DE INVENTARIOS TI",
      PAGE.marginLeft,
      y,
      {
        characterSpacing: 0.65,
        lineBreak: false,
      },
    );

  doc
    .font("Helvetica")
    .fontSize(6.8)
    .fillColor(COLORS.tertiary)
    .text(
      "REPORTE OPERATIVO",
      doc.page.width - PAGE.marginRight - 150,
      y,
      {
        width: 150,
        align: "right",
        characterSpacing: 0.45,
        lineBreak: false,
      },
    );

  y += 17;

  doc
    .strokeColor(COLORS.lineStrong)
    .lineWidth(0.8)
    .moveTo(PAGE.marginLeft, y)
    .lineTo(doc.page.width - PAGE.marginRight, y)
    .stroke();

  y += 16;

  // Título y fecha de emisión
  doc
    .font("Helvetica-Bold")
    .fontSize(25)
    .fillColor(COLORS.ink)
    .text(
      "Informe de inventario",
      PAGE.marginLeft,
      y,
      {
        width: 430,
        lineBreak: false,
      },
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(6.4)
    .fillColor(COLORS.tertiary)
    .text(
      "FECHA DE EMISIÓN",
      doc.page.width - PAGE.marginRight - 180,
      y + 1,
      {
        width: 180,
        align: "right",
        characterSpacing: 0.35,
        lineBreak: false,
      },
    );

  doc
    .font("Helvetica")
    .fontSize(8.4)
    .fillColor(COLORS.text)
    .text(
      formatDateTime(input.generatedAt),
      doc.page.width - PAGE.marginRight - 180,
      y + 13,
      {
        width: 180,
        align: "right",
        lineBreak: false,
      },
    );

  y += 34;

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(COLORS.secondary)
    .text(
      "Documento generado automáticamente a partir de la configuración seleccionada en el módulo de Reportes.",
      PAGE.marginLeft,
      y,
      { width: 520 },
    );

  y += 27;

  // Resumen ejecutivo
  const summaryHeight = 50;
  const summaryWidth = width / 3;

  doc
    .save()
    .fillColor(COLORS.panel)
    .rect(PAGE.marginLeft, y, width, summaryHeight)
    .fill()
    .restore();

  const summaryItems = [
    {
      label: "REGISTROS",
      value: input.report.total.toLocaleString("es-MX"),
      detail: `equipo${input.report.total === 1 ? "" : "s"}`,
    },
    {
      label: "ALCANCE",
      value: scopeSummary(input),
      detail:
        input.scope.accessMode === "manager"
          ? "Alcance de gerencia"
          : "Alcance autorizado",
    },
    {
      label: "ESTADO DE EQUIPOS",
      value: assetStatusLabel(input.definition.assetStatus),
      detail:
        input.definition.scope.includeInactiveBranches
          ? "Incluye sucursales inactivas"
          : "Solo sucursales activas",
    },
  ];

  summaryItems.forEach((item, index) => {
    const x = PAGE.marginLeft + summaryWidth * index;

    if (index > 0) {
      doc
        .strokeColor(COLORS.line)
        .lineWidth(0.6)
        .moveTo(x, y + 9)
        .lineTo(x, y + summaryHeight - 9)
        .stroke();
    }

    doc
      .font("Helvetica-Bold")
      .fontSize(6.2)
      .fillColor(COLORS.tertiary)
      .text(item.label, x + 12, y + 9, {
        width: summaryWidth - 24,
        characterSpacing: 0.35,
        lineBreak: false,
      });

    doc
      .font("Helvetica-Bold")
      .fontSize(index === 0 ? 15 : 9.2)
      .fillColor(COLORS.ink)
      .text(item.value, x + 12, y + 21, {
        width: summaryWidth - 24,
        height: 15,
        ellipsis: true,
        lineBreak: false,
      });

    doc
      .font("Helvetica")
      .fontSize(6.5)
      .fillColor(COLORS.secondary)
      .text(item.detail, x + 12, y + 38, {
        width: summaryWidth - 24,
        height: 9,
        ellipsis: true,
        lineBreak: false,
      });
  });

  y += summaryHeight + 18;

  // Criterios aplicados
  doc
    .font("Helvetica-Bold")
    .fontSize(7)
    .fillColor(COLORS.navyDark)
    .text(
      "CRITERIOS APLICADOS",
      PAGE.marginLeft,
      y,
      { characterSpacing: 0.5 },
    );

  y += 14;

  const configLines = buildConfigurationLines(
    input.definition,
    input.options,
  );
  const configItems = configLines.map(splitConfigurationLine);
  const rows = Math.max(1, Math.ceil(configItems.length / 2));
  const configHeight = Math.max(34, rows * 17 + 12);
  const configColumnWidth = width / 2;

  doc
    .strokeColor(COLORS.line)
    .lineWidth(0.6)
    .rect(PAGE.marginLeft, y, width, configHeight)
    .stroke();

  configItems.forEach((item, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = PAGE.marginLeft + configColumnWidth * column;
    const rowY = y + 7 + row * 17;

    if (column === 1) {
      doc
        .strokeColor(COLORS.line)
        .lineWidth(0.4)
        .moveTo(x, rowY - 4)
        .lineTo(x, rowY + 11)
        .stroke();
    }

    doc
      .font("Helvetica-Bold")
      .fontSize(6.3)
      .fillColor(COLORS.secondary)
      .text(
        item.label.toUpperCase(),
        x + 8,
        rowY,
        {
          width: 92,
          height: 9,
          ellipsis: true,
          lineBreak: false,
          characterSpacing: 0.15,
        },
      );

    doc
      .font("Helvetica")
      .fontSize(6.8)
      .fillColor(COLORS.text)
      .text(
        item.value,
        x + 102,
        rowY,
        {
          width: configColumnWidth - 112,
          height: 9,
          ellipsis: true,
          lineBreak: false,
        },
      );
  });

  y += configHeight + 12;

  if (input.scope.warnings.length > 0) {
    doc
      .save()
      .fillColor(COLORS.amberSoft)
      .rect(PAGE.marginLeft, y, width, 25)
      .fill()
      .restore();

    doc
      .save()
      .fillColor(COLORS.amber)
      .rect(PAGE.marginLeft, y, 3, 25)
      .fill()
      .restore();

    doc
      .font("Helvetica-Bold")
      .fontSize(6.8)
      .fillColor(COLORS.amber)
      .text(
        "AVISO",
        PAGE.marginLeft + 10,
        y + 8,
        { lineBreak: false },
      );

    doc
      .font("Helvetica")
      .fontSize(6.8)
      .fillColor(COLORS.text)
      .text(
        "Existen sucursales con información geográfica incompleta dentro del alcance autorizado.",
        PAGE.marginLeft + 48,
        y + 8,
        {
          width: width - 58,
          height: 10,
          ellipsis: true,
          lineBreak: false,
        },
      );

    y += 34;
  }

  // Entrada a la tabla
  doc
    .font("Helvetica-Bold")
    .fontSize(7)
    .fillColor(COLORS.navyDark)
    .text(
      "DETALLE DEL INVENTARIO",
      PAGE.marginLeft,
      y,
      { characterSpacing: 0.5 },
    );

  if (bandCount > 1) {
    doc
      .font("Helvetica")
      .fontSize(6.4)
      .fillColor(COLORS.secondary)
      .text(
        `Datos generales · Bloque 1 de ${bandCount}. Los mismos equipos continúan en los bloques siguientes con columnas adicionales.`,
        PAGE.marginLeft,
        y + 11,
        {
          width,
          lineBreak: false,
        },
      );

    return y + 25;
  }

  return y + 14;
}

function addPageFooters(
  doc: PDFKit.PDFDocument,
  generatedAt: Date,
): number {
  const range = doc.bufferedPageRange();
  const totalPages = range.count;

  for (
    let pageIndex = range.start;
    pageIndex < range.start + range.count;
    pageIndex += 1
  ) {
    doc.switchToPage(pageIndex);

    const ruleY = doc.page.height - PAGE.marginBottom + 1;
    const footerY = ruleY + 7;

    doc
      .strokeColor(COLORS.line)
      .lineWidth(0.5)
      .moveTo(PAGE.marginLeft, ruleY)
      .lineTo(doc.page.width - PAGE.marginRight, ruleY)
      .stroke();

    doc
      .font("Helvetica")
      .fontSize(6.2)
      .fillColor(COLORS.tertiary)
      .text(
        `Sistema de Inventarios TI · Emitido ${formatDateTime(generatedAt)}`,
        PAGE.marginLeft,
        footerY,
        { lineBreak: false },
      );

    doc
      .font("Helvetica-Bold")
      .fontSize(6.2)
      .fillColor(COLORS.secondary)
      .text(
        `Página ${pageIndex - range.start + 1} de ${totalPages}`,
        doc.page.width - PAGE.marginRight - 120,
        footerY,
        {
          width: 120,
          align: "right",
          lineBreak: false,
        },
      );
  }

  return totalPages;
}

// ======================================================
// RENDER PRINCIPAL
// ======================================================

export async function renderReportPdf(
  input: ReportPdfRenderInput,
): Promise<ReportPdfRenderResult> {
  const doc =
    new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 0,
      bufferPages: true,
      info: {
        Title:
          "Informe de inventario TI",
        Author:
          "Sistema de Inventarios TI",
        Subject:
          "Informe operativo configurable de inventario TI",
        CreationDate:
          input.generatedAt,
      },
    });

  const chunks:
    Buffer[] = [];

  const finished =
    new Promise<Buffer>(
      (resolve, reject) => {
        doc.on(
          "data",
          (chunk: Buffer) =>
            chunks.push(chunk),
        );

        doc.on(
          "end",
          () =>
            resolve(
              Buffer.concat(
                chunks,
              ),
            ),
        );

        doc.on(
          "error",
          reject,
        );
      },
    );

  const bands =
    input.report.rows.length === 0
      ? [
          input.report.columns.slice(
            0,
            TABLE.maxColumnsPerBand,
          ),
        ]
      : splitColumnsIntoBands(
          input.report.columns,
        );

  for (
    let bandIndex = 0;
    bandIndex < bands.length;
    bandIndex += 1
  ) {
    const band =
      bands[bandIndex] ?? [];

    if (bandIndex > 0) {
      doc.addPage({
        size: "A4",
        layout: "landscape",
        margin: 0,
      });
    }

    let y =
      bandIndex === 0
        ? drawCoverHeader(
            doc,
            input,
            bands.length,
          )
        : drawRunningHeader(
            doc,
            bandIndex,
            bands.length,
          );

    const widths =
      columnWidths(
        band,
        availableTableWidth(
          doc,
        ),
      );

    const newTablePage =
      (): number => {
        doc.addPage({
          size: "A4",
          layout: "landscape",
          margin: 0,
        });

        const top =
          drawRunningHeader(
            doc,
            bandIndex,
            bands.length,
          );

        return drawTableHeader(
          doc,
          band,
          widths,
          top,
        );
      };

    const ensureSpace =
      (
        requiredHeight: number,
      ): void => {
        if (
          y +
            requiredHeight >
          pageBottom(doc)
        ) {
          y =
            newTablePage();
        }
      };

    ensureSpace(
      TABLE.headerHeight +
        TABLE.minRowHeight,
    );

    y =
      drawTableHeader(
        doc,
        band,
        widths,
        y,
      );

    let previousGroup:
      | string
      | null = null;

    let inactiveSectionDrawn =
      false;

    input.report.rows.forEach(
      (row, rowIndex) => {
        const group =
          groupInfo(
            row,
            input.definition,
          );

        if (
          group &&
          group.key !==
            previousGroup
        ) {
          if (
            group.inactive &&
            !inactiveSectionDrawn
          ) {
            ensureSpace(
              TABLE.inactiveSectionHeight +
                TABLE.groupHeight +
                TABLE.minRowHeight,
            );

            y =
              drawInactiveSection(
                doc,
                y,
              );

            inactiveSectionDrawn =
              true;
          }

          ensureSpace(
            TABLE.groupHeight +
              TABLE.minRowHeight,
          );

          y =
            drawGroupHeader(
              doc,
              group.title,
              group.inactive,
              y,
            );

          previousGroup =
            group.key;
        }

        const rowHeight =
          measureRowHeight(
            doc,
            row,
            band,
            widths,
          );

        ensureSpace(rowHeight);

        y =
          drawRow(
            doc,
            row,
            band,
            widths,
            y,
            rowIndex,
          );
      },
    );

    if (
      input.report.rows.length ===
      0
    ) {
      ensureSpace(48);

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(
          COLORS.secondary,
        )
        .text(
          "No hay equipos que coincidan con esta configuracion.",
          PAGE.marginLeft,
          y + 16,
          {
            width:
              availableTableWidth(
                doc,
              ),
            align: "center",
          },
        );
    }
  }

  const pageCount =
    addPageFooters(
      doc,
      input.generatedAt,
    );

  doc.end();

  return {
    buffer:
      await finished,
    pageCount,
  };
}
