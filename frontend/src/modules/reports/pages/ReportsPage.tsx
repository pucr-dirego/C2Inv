import {
  CheckCircle2,
  CircleAlert,
  FileText,
  RefreshCw,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Button } from "../../../components/ui/Button";
import { InventoryShell } from "../../inventory/components/InventoryShell";

import { ReportConfigurator } from "../components/ReportConfigurator";
import { ReportPreview } from "../components/ReportPreview";
import {
  createInitialReportDraft,
  toReportPreviewInput,
} from "../data/reports.config";
import {
  downloadReportFile,
  getReportOptions,
  getReportPreview,
  saveReportFile,
} from "../services/reports.service";
import type {
  ReportDraft,
  ReportExportFormat,
  ReportOptionsResult,
  ReportPreviewResult,
} from "../types/reports.types";

import "../reports.css";

export function ReportsPage() {
  const [
    options,
    setOptions,
  ] =
    useState<ReportOptionsResult | null>(
      null,
    );

  const [
    draft,
    setDraft,
  ] =
    useState<ReportDraft | null>(
      null,
    );

  const [
    preview,
    setPreview,
  ] =
    useState<ReportPreviewResult | null>(
      null,
    );

  const [
    loadingOptions,
    setLoadingOptions,
  ] = useState(true);

  const [
    loadingPreview,
    setLoadingPreview,
  ] = useState(false);

  const [
    exportFormat,
    setExportFormat,
  ] =
    useState<ReportExportFormat>(
      "pdf",
    );

  const [
    exportingFormat,
    setExportingFormat,
  ] =
    useState<ReportExportFormat | null>(
      null,
    );

  const [
    error,
    setError,
  ] =
    useState<string | null>(null);

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState<string | null>(null);

  const previewAbortRef =
    useRef<AbortController | null>(
      null,
    );

  const exportAbortRef =
    useRef<AbortController | null>(
      null,
    );

  const successTimerRef =
    useRef<number | null>(
      null,
    );

  const loadOptions =
    useCallback(
      async (
        signal?: AbortSignal,
      ) => {
        setLoadingOptions(true);
        setError(null);

        try {
          const data =
            await getReportOptions(
              signal,
            );

          if (signal?.aborted) {
            return;
          }

          setOptions(data);
          setDraft(
            createInitialReportDraft(
              data,
            ),
          );
          setPreview(null);
        } catch (
          requestError: unknown
        ) {
          if (signal?.aborted) {
            return;
          }

          console.error(
            "Error cargando opciones de Reportes:",
            requestError,
          );

          setError(
            requestError instanceof Error
              ? requestError.message
              : "No fue posible cargar Reportes.",
          );
        } finally {
          if (!signal?.aborted) {
            setLoadingOptions(
              false,
            );
          }
        }
      },
      [],
    );

  useEffect(() => {
    const controller =
      new AbortController();

    void loadOptions(
      controller.signal,
    );

    return () => {
      controller.abort();
      previewAbortRef.current?.abort();
      exportAbortRef.current?.abort();

      if (
        successTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          successTimerRef.current,
        );
      }
    };
  }, [loadOptions]);

  function showSuccess(
    message: string,
  ) {
    setSuccessMessage(message);

    if (
      successTimerRef.current !==
      null
    ) {
      window.clearTimeout(
        successTimerRef.current,
      );
    }

    successTimerRef.current =
      window.setTimeout(
        () => {
          setSuccessMessage(
            null,
          );
          successTimerRef.current =
            null;
        },
        3_500,
      );
  }

  async function runPreview(
    page = 1,
  ) {
    if (!draft) {
      return;
    }

    previewAbortRef.current?.abort();

    const controller =
      new AbortController();

    previewAbortRef.current =
      controller;

    setLoadingPreview(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const data =
        await getReportPreview(
          toReportPreviewInput(
            draft,
            page,
          ),
          controller.signal,
        );

      if (
        controller.signal
          .aborted
      ) {
        return;
      }

      setPreview(data);

      if (page === 1) {
        const recommended =
          data.exportAdvice
            .recommendedFormat;

        const recommendedAllowed =
          recommended === "pdf"
            ? data.exportAdvice
                .pdfAllowed
            : data.exportAdvice
                .xlsxAllowed;

        const fallback:
          ReportExportFormat =
            data.exportAdvice
              .pdfAllowed
              ? "pdf"
              : "xlsx";

        setExportFormat(
          recommendedAllowed
            ? recommended
            : fallback,
        );
      }

      if (page === 1) {
        requestAnimationFrame(
          () => {
            document
              .getElementById(
                "reports-preview",
              )
              ?.scrollIntoView({
                behavior:
                  "smooth",
                block: "start",
              });
          },
        );
      }
    } catch (
      requestError: unknown
    ) {
      if (
        controller.signal
          .aborted
      ) {
        return;
      }

      console.error(
        "Error generando preview de Reportes:",
        requestError,
      );

      setError(
        requestError instanceof Error
          ? requestError.message
          : "No fue posible generar la vista previa.",
      );
    } finally {
      if (
        !controller.signal
          .aborted
      ) {
        setLoadingPreview(
          false,
        );
      }
    }
  }

  async function runExport(
    format: ReportExportFormat,
  ) {
    if (
      !draft ||
      !preview ||
      preview.total === 0
    ) {
      return;
    }

    const allowed =
      format === "pdf"
        ? preview.exportAdvice
            .pdfAllowed
        : preview.exportAdvice
            .xlsxAllowed;

    if (!allowed) {
      return;
    }

    exportAbortRef.current?.abort();

    const controller =
      new AbortController();

    exportAbortRef.current =
      controller;

    setExportingFormat(
      format,
    );
    setError(null);
    setSuccessMessage(null);

    try {
      const download =
        await downloadReportFile(
          format,
          toReportPreviewInput(
            draft,
            1,
          ),
          controller.signal,
        );

      if (
        controller.signal
          .aborted
      ) {
        return;
      }

      saveReportFile(
        download,
      );

      console.info(
        "[reports/export]",
        {
          format:
            download.format,
          filename:
            download.filename,
          ...download.metrics,
        },
      );

      showSuccess(
        format === "pdf"
          ? "PDF generado y enviado a descargas."
          : "Excel generado y enviado a descargas.",
      );
    } catch (
      requestError: unknown
    ) {
      if (
        controller.signal
          .aborted
      ) {
        return;
      }

      console.error(
        `Error descargando ${format.toUpperCase()} de Reportes:`,
        requestError,
      );

      setError(
        requestError instanceof Error
          ? requestError.message
          : "No fue posible descargar el reporte.",
      );
    } finally {
      if (
        !controller.signal
          .aborted
      ) {
        setExportingFormat(
          null,
        );
      }
    }
  }

  return (
    <InventoryShell>
      <main className="reports-root mx-auto max-w-[1280px] px-4 pb-24 sm:px-6">
        <section className="reports-page-intro pb-5 pt-6 sm:pb-7 sm:pt-8">
          <div className="max-w-[1180px]">
            <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-(--text-tertiary)">
              <FileText
                size={13}
                strokeWidth={1.7}
              />
              Reportes
            </div>

            <h1 className="mt-2 text-[clamp(3.2rem,6.2vw,5.6rem)] font-semibold leading-[0.96] tracking-[-0.06em]">
              Información lista para decidir.
            </h1>

            <p className="mt-3 max-w-2xl text-[13px] leading-5 text-(--text-secondary)">
              Parte de una configuración útil, ajusta solo lo necesario y valida el resultado antes de exportarlo.
            </p>
          </div>
        </section>

        {error ? (
          <div className="reports-error mb-4 flex items-start gap-3 rounded-[20px] px-4 py-3.5">
            <CircleAlert
              className="mt-0.5 shrink-0"
              size={17}
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold">
                No fue posible completar la operación
              </div>
              <div className="mt-1 text-xs leading-5 text-(--text-secondary)">
                {error}
              </div>
            </div>

            {!loadingOptions ? (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<RefreshCw size={14} />}
                onClick={() => void loadOptions()}
              >
                Reintentar
              </Button>
            ) : null}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mb-4 flex items-start gap-3 rounded-[20px] border border-emerald-500/15 bg-emerald-500/[0.065] px-4 py-3.5 text-emerald-700">
            <CheckCircle2
              className="mt-0.5 shrink-0"
              size={17}
            />
            <div>
              <div className="text-xs font-semibold">
                Exportación lista
              </div>
              <div className="mt-1 text-xs text-(--text-secondary)">
                {successMessage}
              </div>
            </div>
          </div>
        ) : null}

        {loadingOptions ? (
          <ReportsLoading />
        ) : options && draft ? (
          <>
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start">
              <ReportConfigurator
                options={options}
                draft={draft}
                onChange={(next) => {
                  exportAbortRef.current?.abort();
                  setExportingFormat(null);
                  setDraft(next);
                  setPreview(null);
                  setSuccessMessage(null);
                }}
                onPreview={() => void runPreview(1)}
                loadingPreview={loadingPreview}
              />

              <aside className="hidden xl:block">
                <div className="sticky top-[106px]">
                  <ReportRecipe
                    draft={draft}
                    options={options}
                    preview={preview}
                  />
                </div>
              </aside>
            </div>

            {preview ? (
              <div
                id="reports-preview"
                className="scroll-mt-[105px] pt-6"
              >
                <ReportPreview
                  result={preview}
                  groupGeographically={
                    draft.grouping.geographic
                  }
                  loading={loadingPreview}
                  exportFormat={exportFormat}
                  onExportFormatChange={setExportFormat}
                  exportingFormat={exportingFormat}
                  onExport={(format) =>
                    void runExport(format)
                  }
                  onPageChange={(page) =>
                    void runPreview(page)
                  }
                />
              </div>
            ) : null}
          </>
        ) : null}
      </main>
    </InventoryShell>
  );
}

function ReportsLoading() {
  return (
    <div className="grid gap-4">
      {[0, 1].map((item) => (
        <div
          key={item}
          className="reports-card h-[118px] animate-pulse rounded-[28px]"
        />
      ))}
    </div>
  );
}

function countAppliedFilters(draft: ReportDraft) {
  return [
    draft.filters.equipmentTypeCodes.length,
    draft.filters.departmentIds.length,
    draft.filters.operatingStatusCodes.length,
    draft.filters.physicalConditionCodes.length,
    draft.filters.incorporationTypeCodes.length,
    draft.filters.brands.length,
    draft.filters.dataIssues.length,
    draft.filters.responsibility === "all" ? 0 : 1,
    draft.date.enabled &&
    (draft.date.from || draft.date.to)
      ? 1
      : 0,
  ].reduce((total, value) => total + value, 0);
}

function ReportRecipe({
  draft,
  options,
  preview,
}: {
  draft: ReportDraft;
  options: ReportOptionsResult;
  preview: ReportPreviewResult | null;
}) {
  const selectedColumns =
    draft.columns.mode === "all"
      ? "Todas"
      : String(draft.columns.values.length);

  const allCountriesSelected =
    options.scope.countries.length > 0 &&
    options.scope.countries.every((country) =>
      draft.scope.countryCodes.includes(country.code),
    ) &&
    draft.scope.countryCodes.length ===
      options.scope.countries.length;

  const globalScope =
    options.scope.accessMode === "superadmin" &&
    allCountriesSelected &&
    draft.scope.regions.length === 0 &&
    draft.scope.branchIds.length === 0;

  const scopeText =
    options.scope.accessMode === "manager"
      ? options.scope.branches[0]?.nombre ??
        "Sucursal asignada"
      : globalScope
        ? "Todo el inventario"
        : draft.scope.branchIds.length > 0
          ? `${draft.scope.branchIds.length} sucursal${draft.scope.branchIds.length === 1 ? "" : "es"}`
          : draft.scope.regions.length > 0
            ? `${draft.scope.regions.length} región${draft.scope.regions.length === 1 ? "" : "es"}`
            : `${draft.scope.countryCodes.length} país${draft.scope.countryCodes.length === 1 ? "" : "es"}`;

  const filterCount = countAppliedFilters(draft);

  const organization = draft.grouping.geographic
    ? draft.grouping.secondary
      ? "Ubicación + detalle"
      : "Por ubicación"
    : draft.grouping.secondary
      ? "Agrupación simple"
      : "Tabla continua";

  return (
    <div className="reports-recipe-v2 rounded-[26px] p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-(--text-tertiary)">
            Tu reporte
          </div>
          <div className="mt-1 text-[14px] font-semibold tracking-[-0.02em]">
            Resumen de salida
          </div>
        </div>
        <span className="reports-recipe-status rounded-full px-2.5 py-1 text-[9px] font-semibold">
          {preview ? "Previsualizado" : "Configurable"}
        </span>
      </div>

      <div className="mt-5 space-y-3.5">
        <RecipeLine label="Alcance" value={scopeText} />
        <RecipeLine
          label="Equipos"
          value={
            draft.assetStatus === "active"
              ? "Activos"
              : draft.assetStatus === "inactive"
                ? "Inactivos"
                : "Todos"
          }
        />
        <RecipeLine
          label="Filtros"
          value={
            filterCount === 0
              ? "Ninguno"
              : String(filterCount)
          }
        />
        <RecipeLine
          label="Columnas"
          value={selectedColumns}
        />
        <RecipeLine
          label="Organización"
          value={organization}
        />
      </div>

      <div className="reports-recipe-result mt-5 rounded-[18px] p-4">
        {preview ? (
          <>
            <div className="text-[30px] font-semibold tracking-[-0.055em]">
              {preview.total.toLocaleString("es-MX")}
            </div>
            <div className="mt-0.5 text-[10px] text-(--text-tertiary)">
              equipos en la última vista previa
            </div>
            <div className="mt-3 text-[10px] text-(--text-secondary)">
              Formato sugerido:{" "}
              <strong>
                {preview.exportAdvice.recommendedFormat ===
                "pdf"
                  ? "PDF"
                  : "Excel"}
              </strong>
            </div>
          </>
        ) : (
          <>
            <div className="text-[12px] font-semibold">
              Aún sin consultar
            </div>
            <div className="mt-1 text-[10px] leading-4 text-(--text-tertiary)">
              Genera una vista previa para validar volumen y formato antes de exportar.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function RecipeLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-[10px] text-(--text-tertiary)">
        {label}
      </span>
      <span className="max-w-[160px] truncate text-right text-[10px] font-semibold">
        {value}
      </span>
    </div>
  );
}
