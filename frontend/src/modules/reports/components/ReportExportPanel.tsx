
import {
  Download,
  FileSpreadsheet,
  FileText,
  Sparkles,
  X,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
} from "motion/react";
import { useState } from "react";

import { Button } from "../../../components/ui/Button";
import { cn } from "../../../lib/cn";

import type {
  ReportExportFormat,
  ReportPreviewResult,
} from "../types/reports.types";

interface ReportExportPanelProps {
  result: ReportPreviewResult;
  format: ReportExportFormat;
  onFormatChange: (
    format: ReportExportFormat,
  ) => void;
  onExport: (
    format: ReportExportFormat,
  ) => void;
  exportingFormat:
    | ReportExportFormat
    | null;
}

const FORMAT_INFO: Record<
  ReportExportFormat,
  {
    label: string;
    description: string;
  }
> = {
  pdf: {
    label: "PDF",
    description:
      "Documento formal para compartir, archivar o imprimir.",
  },
  xlsx: {
    label: "Excel",
    description:
      "Ideal para volumen, filtros, análisis y trabajo posterior.",
  },
};

export function ReportExportPanel({
  result,
  format,
  onFormatChange,
  onExport,
  exportingFormat,
}: ReportExportPanelProps) {
  const [
    confirmPdf,
    setConfirmPdf,
  ] = useState(false);

  const recommended =
    result.exportAdvice
      .recommendedFormat;

  const pdfAllowed =
    result.exportAdvice
      .pdfAllowed;

  const xlsxAllowed =
    result.exportAdvice
      .xlsxAllowed;

  const formatAllowed =
    format === "pdf"
      ? pdfAllowed
      : xlsxAllowed;

  const isExporting =
    exportingFormat !== null;

  function selectFormat(
    next:
      ReportExportFormat,
  ) {
    const allowed =
      next === "pdf"
        ? pdfAllowed
        : xlsxAllowed;

    if (!allowed) {
      return;
    }

    setConfirmPdf(false);
    onFormatChange(next);
  }

  function requestExport() {
    if (
      !formatAllowed ||
      isExporting
    ) {
      return;
    }

    if (
      format === "pdf" &&
      recommended ===
        "xlsx"
    ) {
      setConfirmPdf(true);
      return;
    }

    onExport(format);
  }

  return (
    <div className="reports-card w-full rounded-[24px] p-4 lg:min-w-[360px]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-stretch">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-(--text-tertiary)">
            <Download size={13} />
            Exportar
          </div>

          <div className="reports-segmented mt-3 inline-flex rounded-full p-1">
            {(
              [
                "pdf",
                "xlsx",
              ] as const
            ).map((item) => {
              const active =
                item === format;

              const allowed =
                item === "pdf"
                  ? pdfAllowed
                  : xlsxAllowed;

              return (
                <button
                  key={item}
                  type="button"
                  disabled={
                    !allowed ||
                    isExporting
                  }
                  onClick={() =>
                    selectFormat(
                      item,
                    )
                  }
                  className={cn(
                    "relative min-w-[88px] rounded-full px-3.5 py-2 text-[12px] font-medium transition-colors",
                    active
                      ? "text-(--text-primary)"
                      : "text-(--text-tertiary) hover:text-(--text-secondary)",
                    !allowed &&
                      "cursor-not-allowed opacity-35",
                  )}
                >
                  {active ? (
                    <motion.span
                      layoutId="reports-export-format-pill"
                      className="reports-segmented-pill absolute inset-0 rounded-full"
                      transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 34,
                      }}
                    />
                  ) : null}

                  <span className="relative z-10 inline-flex items-center gap-1.5">
                    {item ===
                    "pdf" ? (
                      <FileText size={13} />
                    ) : (
                      <FileSpreadsheet size={13} />
                    )}

                    {
                      FORMAT_INFO[
                        item
                      ].label
                    }

                    {recommended ===
                    item ? (
                      <span className="text-[8px] font-semibold uppercase tracking-[0.08em] text-(--accent)">
                        recomendado
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-w-0 sm:max-w-[330px] lg:max-w-none">
          <div className="text-xs font-semibold">
            {
              FORMAT_INFO[
                format
              ].label
            }
          </div>
          <p className="mt-1 text-[10px] leading-4 text-(--text-tertiary)">
            {
              FORMAT_INFO[
                format
              ].description
            }
          </p>

          {!formatAllowed ? (
            <p className="mt-2 text-[10px] font-medium leading-4 text-amber-700">
              Este formato no está disponible con la política de exportación actual.
            </p>
          ) : null}
        </div>
      </div>

      <Button
        size="sm"
        className="mt-4 w-full rounded-full"
        loading={
          exportingFormat ===
          format
        }
        disabled={
          !formatAllowed ||
          isExporting
        }
        leftIcon={
          <Download size={15} />
        }
        onClick={
          requestExport
        }
      >
        Descargar{" "}
        {
          FORMAT_INFO[
            format
          ].label
        }
      </Button>

      <AnimatePresence>
        {confirmPdf ? (
          <motion.div
            initial={{
              opacity: 0,
              height: 0,
            }}
            animate={{
              opacity: 1,
              height: "auto",
            }}
            exit={{
              opacity: 0,
              height: 0,
            }}
            className="overflow-hidden"
          >
            <div className="reports-confirmation mt-3 rounded-[18px] p-3.5">
              <div className="flex items-start gap-2.5">
                <Sparkles
                  size={15}
                  className="mt-0.5 shrink-0 text-(--accent)"
                />

                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold">
                    Excel es el formato recomendado
                  </div>
                  <p className="mt-1 text-[10px] leading-4 text-(--text-secondary)">
                    Por el volumen o ancho del reporte, Excel será más cómodo. PDF sigue permitido si necesitas el documento formal.
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="Cerrar"
                  onClick={() =>
                    setConfirmPdf(
                      false,
                    )
                  }
                  className="reports-icon flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                >
                  <X size={13} />
                </button>
              </div>

              <div className="mt-3 flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setConfirmPdf(
                      false,
                    );
                    onFormatChange(
                      "xlsx",
                    );
                  }}
                >
                  Usar Excel
                </Button>

                <Button
                  size="sm"
                  onClick={() => {
                    setConfirmPdf(
                      false,
                    );
                    onExport(
                      "pdf",
                    );
                  }}
                >
                  Continuar con PDF
                </Button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
