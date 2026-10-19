
import {
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  MapPinOff,
} from "lucide-react";
import { motion } from "motion/react";

import { Button } from "../../../components/ui/Button";
import { cn } from "../../../lib/cn";

import {
  REPORT_COLUMN_LABELS,
} from "../data/reports.config";

import { ReportExportPanel } from "./ReportExportPanel";

import type {
  ReportColumnKey,
  ReportExportFormat,
  ReportPreviewResult,
  ReportPreviewRow,
} from "../types/reports.types";

interface ReportPreviewProps {
  result: ReportPreviewResult;
  groupGeographically: boolean;
  exportFormat: ReportExportFormat;
  onExportFormatChange: (
    format: ReportExportFormat,
  ) => void;
  onExport: (
    format: ReportExportFormat,
  ) => void;
  exportingFormat:
    | ReportExportFormat
    | null;
  onPageChange: (
    page: number,
  ) => void;
  loading: boolean;
}

interface RowGroup {
  key: string;
  title: string;
  kind:
    | "active"
    | "unknown"
    | "inactive";
  rows: ReportPreviewRow[];
}

function valueText(
  value:
    | string
    | number
    | boolean
    | null
    | undefined,
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  if (
    typeof value === "boolean"
  ) {
    return value
      ? "Sí"
      : "No";
  }

  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T/.test(
      value,
    )
  ) {
    const date =
      new Date(value);

    if (
      !Number.isNaN(
        date.getTime(),
      )
    ) {
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

function makeGroups(
  rows: ReportPreviewRow[],
): RowGroup[] {
  const groups =
    new Map<
      string,
      RowGroup
    >();

  for (const row of rows) {
    const branchStatus =
      valueText(
        row.branchStatus,
      );

    const country =
      valueText(row.country);

    const region =
      valueText(row.region);

    const branch =
      valueText(row.branch);

    const inactive =
      branchStatus ===
      "Inactiva";

    const unknown =
      country ===
        "Ubicación no configurada" ||
      region ===
        "Ubicación no configurada";

    const kind: RowGroup["kind"] =
      inactive
        ? "inactive"
        : unknown
          ? "unknown"
          : "active";

    const title =
      inactive
        ? `Sucursales inactivas · ${country} · ${region} · ${branch}`
        : unknown
          ? `Ubicación no configurada · ${branch}`
          : `${country} · ${region} · ${branch}`;

    const key =
      `${kind}::${title}`;

    const current =
      groups.get(key);

    if (current) {
      current.rows.push(row);
    } else {
      groups.set(key, {
        key,
        title,
        kind,
        rows: [row],
      });
    }
  }

  return Array.from(
    groups.values(),
  );
}

function TableRows({
  rows,
  columns,
}: {
  rows: ReportPreviewRow[];
  columns: ReportColumnKey[];
}) {
  return (
    <>
      {rows.map(
        (row, rowIndex) => (
          <tr
            key={`${String(row.inventoryNumber ?? "row")}-${rowIndex}`}
          >
            {columns.map(
              (column) => (
                <td
                  key={column}
                  className={cn(
                    "whitespace-nowrap px-4 py-3 text-[11px] text-(--text-secondary)",
                    column ===
                      "inventoryNumber" &&
                      "font-semibold text-(--text-primary)",
                    (
                      column ===
                        "observations" ||
                      column ===
                        "deactivationDetail" ||
                      column ===
                        "exactLocation"
                    ) &&
                      "max-w-[280px] whitespace-normal leading-5",
                  )}
                >
                  {valueText(
                    row[column],
                  )}
                </td>
              ),
            )}
          </tr>
        ),
      )}
    </>
  );
}

export function ReportPreview({
  result,
  groupGeographically,
  exportFormat,
  onExportFormatChange,
  onExport,
  exportingFormat,
  onPageChange,
  loading,
}: ReportPreviewProps) {
  const grouped =
    result.rows.some(
      (row) =>
        row.branch !==
        undefined,
    )
      ? makeGroups(
          result.rows,
        )
      : [];

  const useGroups =
    groupGeographically &&
    grouped.length > 0;

  const busy =
    loading ||
    exportingFormat !== null;

  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 18,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.32,
        ease: [
          0.22,
          1,
          0.36,
          1,
        ],
      }}
      className="mt-8"
      aria-busy={busy}
    >
      <div className="mb-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(360px,auto)] lg:items-end">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-(--text-tertiary)">
            Vista previa
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-[34px] font-semibold tracking-[-0.055em]">
              {result.total.toLocaleString(
                "es-MX",
              )}
            </span>
            <span className="text-sm text-(--text-secondary)">
              equipo{result.total === 1 ? "" : "s"}
            </span>
          </div>

          <p className="mt-1 text-xs text-(--text-tertiary)">
            Página {result.page} de{" "}
            {Math.max(
              result.totalPages,
              1,
            )} · hasta {result.pageSize} filas por página
          </p>
        </div>

        {result.total > 0 ? (
          <ReportExportPanel
            result={result}
            format={
              exportFormat
            }
            onFormatChange={
              onExportFormatChange
            }
            onExport={
              onExport
            }
            exportingFormat={
              exportingFormat
            }
          />
        ) : null}
      </div>

      {result.scope.warnings.map(
        (warning) => (
          <div
            key={warning.code}
            className="reports-warning mb-3 flex items-start gap-3 rounded-[20px] px-4 py-3.5"
          >
            <MapPinOff
              size={17}
              className="mt-0.5 shrink-0"
            />
            <div>
              <div className="text-xs font-semibold">
                Información geográfica incompleta
              </div>
              <div className="mt-1 text-[10px] leading-4 text-(--text-tertiary)">
                {warning.message}
              </div>
            </div>
          </div>
        ),
      )}

      {result.total === 0 ? (
        <div className="reports-card rounded-[30px] px-6 py-14 text-center">
          <CircleAlert
            size={22}
            className="mx-auto text-(--text-tertiary)"
          />
          <div className="mt-4 text-sm font-semibold">
            No encontramos equipos con esta configuración
          </div>
          <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-(--text-tertiary)">
            Prueba ampliando el alcance o retirando alguno de los filtros.
          </p>
        </div>
      ) : (
        <div className="reports-table-shell overflow-hidden rounded-[28px]">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  {result.columns.map(
                    (column) => (
                      <th
                        key={column}
                        className="sticky top-0 z-10 whitespace-nowrap px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.1em] text-(--text-tertiary)"
                      >
                        {REPORT_COLUMN_LABELS[
                          column
                        ]}
                      </th>
                    ),
                  )}
                </tr>
              </thead>

              <tbody>
                {useGroups
                  ? grouped.map(
                      (group) => (
                        <FragmentGroup
                          key={
                            group.key
                          }
                          group={
                            group
                          }
                          columns={
                            result.columns
                          }
                        />
                      ),
                    )
                  : (
                    <TableRows
                      rows={
                        result.rows
                      }
                      columns={
                        result.columns
                      }
                    />
                  )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {result.totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between gap-3">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={
              <ChevronLeft size={15} />
            }
            disabled={
              result.page <= 1 ||
              busy
            }
            onClick={() =>
              onPageChange(
                result.page - 1,
              )
            }
          >
            Anterior
          </Button>

          <div className="text-[11px] font-medium text-(--text-tertiary)">
            {result.page} /{" "}
            {result.totalPages}
          </div>

          <Button
            variant="secondary"
            size="sm"
            rightIcon={
              <ChevronRight size={15} />
            }
            disabled={
              result.page >=
                result.totalPages ||
              busy
            }
            onClick={() =>
              onPageChange(
                result.page + 1,
              )
            }
          >
            Siguiente
          </Button>
        </div>
      ) : null}
    </motion.section>
  );
}

function FragmentGroup({
  group,
  columns,
}: {
  group: RowGroup;
  columns: ReportColumnKey[];
}) {
  return (
    <>
      <tr>
        <td
          colSpan={columns.length}
          className={cn(
            "reports-group-row px-4 py-2.5 text-[10px] font-semibold",
            group.kind ===
              "unknown" &&
              "reports-group-row-unknown",
            group.kind ===
              "inactive" &&
              "reports-group-row-inactive",
          )}
        >
          {group.title}
          <span className="ml-2 font-normal opacity-60">
            {group.rows.length} en esta página
          </span>
        </td>
      </tr>

      <TableRows
        rows={group.rows}
        columns={columns}
      />
    </>
  );
}
