
import ExcelJS, {
  type Worksheet,
} from "exceljs";

import type {
  ReportCatalogOption,
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
// CONTRATO
// ======================================================

export interface ReportXlsxRenderInput {
  report: ReportExportQueryResult;
  definition: ReportPreviewInput;
  scope: ResolvedReportScope;
  options: ReportOptionsResult;
  generatedAt: Date;
}

export interface ReportXlsxRenderResult {
  buffer: Buffer;
  worksheetCount: number;
}

// ======================================================
// PRESENTACIÓN
// ======================================================

const COLUMN_LABELS: Record<
  ReportColumnKey,
  string
> = {
  inventoryNumber: "N.º inventario",
  equipmentType: "Tipo de equipo",
  brand: "Marca",
  model: "Modelo",
  serialNumber: "N.º serie",
  hostname: "Hostname",
  ipAddress: "Dirección IP",
  operatingSystem: "Sistema operativo",
  anydesk: "AnyDesk",
  country: "País",
  region: "Región",
  branch: "Sucursal",
  branchStatus: "Estado sucursal",
  department: "Departamento",
  responsible: "Responsable",
  exactLocation: "Ubicación exacta",
  operatingStatus: "Funcionamiento",
  physicalCondition: "Condición física",
  incorporationType: "Incorporación",
  observations: "Observaciones",
  invoiceNumber: "N.º factura",
  invoiceDate: "Fecha factura",
  invoiceSupplier: "Proveedor",
  invoiceBusinessName: "Razón social",
  invoiceCurrency: "Moneda",
  invoiceTotal: "Total factura",
  invoiceItem: "Partida factura",
  acquisitionAmount: "Importe adquisición",
  assetStatus: "Estado del activo",
  createdAt: "Fecha de alta",
  updatedAt: "Última actualización",
  deactivatedAt: "Fecha de baja",
  deactivationReason: "Motivo de baja",
  deactivationDetail: "Detalle de baja",
  reactivatedAt: "Fecha de reactivación",
};

const COLUMN_WIDTHS: Partial<
  Record<ReportColumnKey, number>
> = {
  inventoryNumber: 18,
  equipmentType: 20,
  brand: 16,
  model: 22,
  serialNumber: 22,
  hostname: 22,
  ipAddress: 18,
  operatingSystem: 24,
  anydesk: 16,
  country: 16,
  region: 22,
  branch: 26,
  branchStatus: 18,
  department: 24,
  responsible: 28,
  exactLocation: 30,
  operatingStatus: 22,
  physicalCondition: 22,
  incorporationType: 22,
  observations: 42,
  invoiceNumber: 18,
  invoiceDate: 16,
  invoiceSupplier: 28,
  invoiceBusinessName: 30,
  invoiceCurrency: 12,
  invoiceTotal: 18,
  invoiceItem: 20,
  acquisitionAmount: 20,
  assetStatus: 16,
  createdAt: 20,
  updatedAt: 20,
  deactivatedAt: 20,
  deactivationReason: 26,
  deactivationDetail: 38,
  reactivatedAt: 20,
};

const LONG_TEXT_COLUMNS =
  new Set<ReportColumnKey>([
    "observations",
    "exactLocation",
    "invoiceSupplier",
    "invoiceBusinessName",
    "deactivationReason",
    "deactivationDetail",
  ]);

const DATE_ONLY_COLUMNS =
  new Set<ReportColumnKey>([
    "invoiceDate",
  ]);

const DATE_TIME_COLUMNS =
  new Set<ReportColumnKey>([
    "createdAt",
    "updatedAt",
    "deactivatedAt",
    "reactivatedAt",
  ]);

const NUMERIC_COLUMNS =
  new Set<ReportColumnKey>([
    "invoiceTotal",
    "acquisitionAmount",
  ]);

const DATA_ISSUE_LABELS: Record<
  ReportDataIssueKey,
  string
> = {
  missing_responsible: "Sin responsable",
  missing_invoice: "Factura pendiente",
  missing_acquisition_amount:
    "Sin importe de adquisición",
  physical_damage: "Daño físico",
  operating_observations:
    "Operativo con observaciones",
  not_operational: "No operativo",
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
  incorporationType: "Tipo de incorporación",
  brand: "Marca",
};

const RESPONSIBILITY_LABELS = {
  all: "Todos",
  assigned: "Asignados",
  unassigned: "Sin asignar",
} as const;

const ASSET_STATUS_LABELS = {
  active: "Activos",
  inactive: "Inactivos",
  all: "Todos",
} as const;

// ======================================================
// HELPERS
// ======================================================

function formatGeneratedAt(
  date: Date,
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
  ).format(date);
}

function textOrDash(
  value: unknown,
): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Sí" : "No";
  }

  return String(value);
}

function parseDateOnly(
  value: string,
): Date | null {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})/.exec(
      value,
    );

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return null;
  }

  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
    ),
  );
}

function excelValue(
  key: ReportColumnKey,
  value: unknown,
): unknown {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (
    NUMERIC_COLUMNS.has(key)
  ) {
    const number =
      typeof value === "number"
        ? value
        : Number(value);

    return Number.isFinite(number)
      ? number
      : textOrDash(value);
  }

  if (
    DATE_ONLY_COLUMNS.has(key) &&
    typeof value === "string"
  ) {
    return (
      parseDateOnly(value) ??
      value
    );
  }

  if (
    DATE_TIME_COLUMNS.has(key) &&
    typeof value === "string"
  ) {
    const date =
      new Date(value);

    return Number.isNaN(
      date.getTime(),
    )
      ? value
      : date;
  }

  return value;
}

function namesFromCatalogCodes(
  selected: string[],
  options: ReportCatalogOption[],
): string {
  if (selected.length === 0) {
    return "Todos";
  }

  const names = new Map(
    options.map((item) => [
      item.code,
      item.name,
    ]),
  );

  return selected
    .map(
      (code) =>
        names.get(code) ??
        code,
    )
    .join(", ");
}

function namesFromCatalogIds(
  selected: string[],
  options: ReportCatalogOption[],
): string {
  if (selected.length === 0) {
    return "Todos";
  }

  const names = new Map(
    options.map((item) => [
      item.id,
      item.name,
    ]),
  );

  return selected
    .map(
      (id) =>
        names.get(id) ??
        id,
    )
    .join(", ");
}

function configurationEntries(
  input: ReportXlsxRenderInput,
): Array<[string, string]> {
  const {
    definition,
    options,
    report,
  } = input;

  const countryLabels =
    new Map(
      options.scope.countries.map(
        (country) => [
          country.code,
          country.label,
        ],
      ),
    );

  const branchLabels =
    new Map(
      options.scope.branches.map(
        (branch) => [
          branch.id,
          branch.nombre,
        ],
      ),
    );

  const countries =
    definition.scope.countryCodes.length
      ? definition.scope.countryCodes
          .map(
            (code) =>
              countryLabels.get(code) ??
              code,
          )
          .join(", ")
      : "Todos";

  const regions =
    definition.scope.regions.length
      ? definition.scope.regions
          .map(
            (region) =>
              `${countryLabels.get(region.countryCode) ?? region.countryCode} · ${region.name}`,
          )
          .join(", ")
      : "Todas";

  const branches =
    definition.scope.branchIds.length
      ? definition.scope.branchIds
          .map(
            (id) =>
              branchLabels.get(id) ??
              id,
          )
          .join(", ")
      : "Todas";

  const date =
    definition.date
      ? [
          DATE_FIELD_LABELS[
            definition.date.field
          ],
          definition.date.from
            ? `desde ${definition.date.from}`
            : null,
          definition.date.to
            ? `hasta ${definition.date.to}`
            : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : "Sin filtro de fecha";

  const grouping = [
    definition.grouping.geographic
      ? "País → Región → Sucursal"
      : "Tabla plana",
    definition.grouping.secondary
      ? SECONDARY_GROUP_LABELS[
          definition.grouping.secondary
        ]
      : null,
  ]
    .filter(Boolean)
    .join(" + ");

  return [
    [
      "Registros",
      report.total.toLocaleString(
        "es-MX",
      ),
    ],
    ["País", countries],
    ["Región", regions],
    ["Sucursal", branches],
    [
      "Sucursales inactivas",
      definition.scope
        .includeInactiveBranches
        ? "Incluidas"
        : "No incluidas",
    ],
    [
      "Estado del equipo",
      ASSET_STATUS_LABELS[
        definition.assetStatus
      ],
    ],
    [
      "Tipo de equipo",
      namesFromCatalogCodes(
        definition.filters
          .equipmentTypeCodes,
        options.filters
          .equipmentTypes,
      ),
    ],
    [
      "Departamento",
      namesFromCatalogIds(
        definition.filters
          .departmentIds,
        options.filters
          .departments,
      ),
    ],
    [
      "Funcionamiento",
      namesFromCatalogCodes(
        definition.filters
          .operatingStatusCodes,
        options.filters
          .operatingStatuses,
      ),
    ],
    [
      "Condición física",
      namesFromCatalogCodes(
        definition.filters
          .physicalConditionCodes,
        options.filters
          .physicalConditions,
      ),
    ],
    [
      "Incorporación",
      namesFromCatalogCodes(
        definition.filters
          .incorporationTypeCodes,
        options.filters
          .incorporationTypes,
      ),
    ],
    [
      "Marca",
      definition.filters.brands
        .length
        ? definition.filters.brands.join(
            ", ",
          )
        : "Todas",
    ],
    [
      "Responsable",
      RESPONSIBILITY_LABELS[
        definition.filters
          .responsibility
      ],
    ],
    [
      "Condiciones de atención",
      definition.filters.dataIssues
        .length
        ? definition.filters.dataIssues
            .map(
              (issue) =>
                DATA_ISSUE_LABELS[
                  issue
                ],
            )
            .join(", ")
        : "Ninguna",
    ],
    ["Fecha", date],
    ["Agrupación", grouping],
    [
      "Columnas",
      report.columns
        .map(
          (column) =>
            COLUMN_LABELS[
              column
            ],
        )
        .join(", "),
    ],
  ];
}

function styleInventorySheet(
  worksheet: Worksheet,
  columns: ReportColumnKey[],
): void {
  const header =
    worksheet.getRow(1);

  header.height = 24;
  header.font = {
    bold: true,
    color: {
      argb: "FFFFFFFF",
    },
    size: 10,
  };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF1D1D1F",
    },
  };
  header.alignment = {
    vertical: "middle",
    horizontal: "left",
  };

  for (
    let index = 0;
    index < columns.length;
    index += 1
  ) {
    const key = columns[index];

    if (!key) {
      continue;
    }

    const column =
      worksheet.getColumn(
        index + 1,
      );

    column.width =
      COLUMN_WIDTHS[key] ?? 18;

    if (
      DATE_ONLY_COLUMNS.has(key)
    ) {
      column.numFmt =
        "dd/mm/yyyy";
    }

    if (
      DATE_TIME_COLUMNS.has(key)
    ) {
      column.numFmt =
        "dd/mm/yyyy hh:mm";
    }

    if (
      NUMERIC_COLUMNS.has(key)
    ) {
      column.numFmt =
        '#,##0.00';
    }

    column.alignment = {
      vertical: "top",
      horizontal: "left",
      wrapText:
        LONG_TEXT_COLUMNS.has(key),
    };
  }

  worksheet.views = [
    {
      state: "frozen",
      ySplit: 1,
    },
  ];

  if (columns.length > 0) {
    worksheet.autoFilter = {
      from: {
        row: 1,
        column: 1,
      },
      to: {
        row: 1,
        column:
          columns.length,
      },
    };
  }
}

function styleDataRows(
  worksheet: Worksheet,
): void {
  worksheet.eachRow(
    (
      row,
      rowNumber,
    ) => {
      if (rowNumber === 1) {
        return;
      }

      row.height = 20;

      if (
        rowNumber % 2 === 0
      ) {
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb:
              "FFF7F7F8",
          },
        };
      }

      row.font = {
        size: 9,
        color: {
          argb:
            "FF1D1D1F",
        },
      };

      row.eachCell(
        {
          includeEmpty: true,
        },
        (cell) => {
          cell.border = {
            bottom: {
              style: "hair",
              color: {
                argb:
                  "FFE5E5EA",
              },
            },
          };
        },
      );
    },
  );
}

function buildInventoryWorksheet(
  workbook: ExcelJS.Workbook,
  report: ReportExportQueryResult,
): void {
  const worksheet =
    workbook.addWorksheet(
      "Inventario",
      {
        properties: {
          defaultRowHeight: 20,
        },
      },
    );

  worksheet.columns =
    report.columns.map(
      (key) => ({
        header:
          COLUMN_LABELS[key],
        key,
        width:
          COLUMN_WIDTHS[key] ??
          18,
      }),
    );

  for (const row of report.rows) {
    const values:
      Record<
        string,
        unknown
      > = {};

    for (
      const key of
      report.columns
    ) {
      values[key] =
        excelValue(
          key,
          row[key],
        );
    }

    worksheet.addRow(values);
  }

  styleInventorySheet(
    worksheet,
    report.columns,
  );
  styleDataRows(
    worksheet,
  );
}

function buildConfigurationWorksheet(
  workbook: ExcelJS.Workbook,
  input: ReportXlsxRenderInput,
): void {
  const worksheet =
    workbook.addWorksheet(
      "Configuración",
      {
        properties: {
          defaultRowHeight: 20,
        },
      },
    );

  worksheet.columns = [
    {
      key: "field",
      width: 27,
    },
    {
      key: "value",
      width: 88,
    },
  ];

  worksheet.mergeCells(
    "A1:B1",
  );

  const title =
    worksheet.getCell("A1");

  title.value =
    "Sistema de Inventarios TI · Reporte";
  title.font = {
    bold: true,
    size: 18,
    color: {
      argb: "FF1D1D1F",
    },
  };
  title.alignment = {
    vertical: "middle",
  };

  worksheet.getRow(1).height =
    32;

  worksheet.mergeCells(
    "A2:B2",
  );

  const subtitle =
    worksheet.getCell("A2");

  subtitle.value =
    `Generado ${formatGeneratedAt(input.generatedAt)}`;
  subtitle.font = {
    size: 10,
    color: {
      argb: "FF6E6E73",
    },
  };

  let rowNumber = 4;

  worksheet.mergeCells(
    `A${rowNumber}:B${rowNumber}`,
  );

  const section =
    worksheet.getCell(
      `A${rowNumber}`,
    );

  section.value =
    "Definición del reporte";
  section.font = {
    bold: true,
    size: 11,
    color: {
      argb: "FF0071E3",
    },
  };
  section.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FFF0F7FF",
    },
  };

  rowNumber += 1;

  for (
    const [
      field,
      value,
    ] of configurationEntries(input)
  ) {
    const row =
      worksheet.getRow(
        rowNumber,
      );

    row.getCell(1).value =
      field;
    row.getCell(2).value =
      value;

    row.getCell(1).font = {
      bold: true,
      size: 9,
      color: {
        argb: "FF6E6E73",
      },
    };

    row.getCell(2).font = {
      size: 9,
      color: {
        argb: "FF1D1D1F",
      },
    };

    row.alignment = {
      vertical: "top",
      wrapText: true,
    };

    rowNumber += 1;
  }

  if (
    input.scope.warnings.length >
    0
  ) {
    rowNumber += 1;

    worksheet.mergeCells(
      `A${rowNumber}:B${rowNumber}`,
    );

    const warningHeader =
      worksheet.getCell(
        `A${rowNumber}`,
      );

    warningHeader.value =
      "Avisos";
    warningHeader.font = {
      bold: true,
      size: 11,
      color: {
        argb: "FFA05A00",
      },
    };
    warningHeader.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FFFFF7E8",
      },
    };

    rowNumber += 1;

    for (
      const warning of
      input.scope.warnings
    ) {
      const row =
        worksheet.getRow(
          rowNumber,
        );

      row.getCell(1).value =
        "Geografía";
      row.getCell(2).value =
        warning.message;
      row.alignment = {
        vertical: "top",
        wrapText: true,
      };

      rowNumber += 1;
    }
  }

  worksheet.views = [
    {
      state: "frozen",
      ySplit: 2,
    },
  ];
}

// ======================================================
// RENDER
// ======================================================

export async function renderReportXlsx(
  input: ReportXlsxRenderInput,
): Promise<ReportXlsxRenderResult> {
  const workbook =
    new ExcelJS.Workbook();

  workbook.creator =
    "Sistema de Inventarios TI";
  workbook.lastModifiedBy =
    "Sistema de Inventarios TI";
  workbook.created =
    input.generatedAt;
  workbook.modified =
    input.generatedAt;

  buildInventoryWorksheet(
    workbook,
    input.report,
  );

  buildConfigurationWorksheet(
    workbook,
    input,
  );

  const raw =
    await workbook.xlsx.writeBuffer();

  const buffer =
    Buffer.from(raw);

  return {
    buffer,
    worksheetCount:
      workbook.worksheets.length,
  };
}
