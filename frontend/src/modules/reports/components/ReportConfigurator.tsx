import {
  AnimatePresence,
  motion,
} from "motion/react";
import {
  BriefcaseBusiness,
  Check,
  ChevronRight,
  FileSliders,
  Filter,
  Globe2,
  History,
  Layers3,
  ListFilter,
  MapPin,
  PackageCheck,
  RotateCcw,
  Search,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { Button } from "../../../components/ui/Button";
import { Checkbox } from "../../../components/ui/Checkbox";
import { cn } from "../../../lib/cn";

import {
  DATA_ISSUE_OPTIONS,
  DATE_FIELD_OPTIONS,
  DEFAULT_REPORT_COLUMNS,
  REPORT_COLUMNS,
  REPORT_COLUMN_LABELS,
  REPORT_PRESETS,
  SECONDARY_GROUP_OPTIONS,
} from "../data/reports.config";

import type {
  ReportCatalogOption,
  ReportColumnKey,
  ReportCountryCode,
  ReportDraft,
  ReportOptionsResult,
  ReportPreset,
  ReportRegionSelection,
  ReportScopeBranch,
} from "../types/reports.types";

interface ReportConfiguratorProps {
  options: ReportOptionsResult;
  draft: ReportDraft;
  onChange: (next: ReportDraft) => void;
  onPreview: () => void;
  loadingPreview: boolean;
}

type EditorKey =
  | "scope"
  | "filters"
  | "columns"
  | "grouping";

type PresetId = ReportPreset["id"];

function toggleValue(
  values: string[],
  value: string,
) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function sameRegion(
  a: ReportRegionSelection,
  b: ReportRegionSelection,
) {
  return (
    a.countryCode === b.countryCode &&
    a.name === b.name
  );
}

function branchAllowedByGeography(
  branch: ReportScopeBranch,
  draft: ReportDraft,
) {
  if (
    branch.countryCode &&
    !draft.scope.countryCodes.includes(
      branch.countryCode,
    )
  ) {
    return false;
  }

  if (draft.scope.regions.length > 0) {
    if (!branch.countryCode || !branch.region) {
      return false;
    }

    return draft.scope.regions.some(
      (region) =>
        region.countryCode === branch.countryCode &&
        region.name === branch.region,
    );
  }

  return true;
}

function catalogItems(
  values: ReportCatalogOption[],
) {
  return values.map((item) => ({
    value: item.code,
    label: item.name,
  }));
}

function catalogIdItems(
  values: ReportCatalogOption[],
) {
  return values.map((item) => ({
    value: item.id,
    label: item.name,
  }));
}

function presetIcon(id: PresetId) {
  switch (id) {
    case "location":
      return <MapPin size={16} />;
    case "attention":
      return <ListFilter size={16} />;
    case "assignments":
      return <UsersRound size={16} />;
    case "history":
      return <History size={16} />;
    default:
      return <PackageCheck size={16} />;
  }
}

function assetStatusLabel(
  value: ReportDraft["assetStatus"],
) {
  if (value === "inactive") {
    return "Inactivos";
  }

  if (value === "all") {
    return "Todos";
  }

  return "Activos";
}

function secondaryGroupingLabel(
  value: ReportDraft["grouping"]["secondary"],
) {
  if (!value) {
    return null;
  }

  return (
    SECONDARY_GROUP_OPTIONS.find(
      (option) => option.value === value,
    )?.label ?? null
  );
}

function MultiOptionList({
  items,
  selected,
  onToggle,
  emptyLabel,
}: {
  items: Array<{
    value: string;
    label: string;
    detail?: string;
    disabled?: boolean;
  }>;
  selected: string[];
  onToggle: (value: string) => void;
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return (
      <div className="reports-empty rounded-[18px] px-4 py-5 text-center text-xs text-(--text-tertiary)">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((item) => {
        const active = selected.includes(item.value);

        return (
          <button
            key={item.value}
            type="button"
            disabled={item.disabled}
            onClick={() => onToggle(item.value)}
            className={cn(
              "reports-option flex min-h-[52px] items-center gap-3 rounded-[16px] px-3.5 py-3 text-left transition",
              active && "reports-option-active",
              item.disabled &&
                "cursor-not-allowed opacity-45",
            )}
          >
            <span
              className={cn(
                "reports-check-dot flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition",
                active && "reports-check-dot-active",
              )}
            >
              <Check
                size={12}
                strokeWidth={2.6}
              />
            </span>

            <span className="min-w-0">
              <span className="block truncate text-[13px] font-medium">
                {item.label}
              </span>
              {item.detail ? (
                <span className="mt-0.5 block truncate text-[10px] text-(--text-tertiary)">
                  {item.detail}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function EditorDrawer({
  title,
  description,
  open,
  onClose,
  children,
}: {
  title: string;
  description: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const html = document.documentElement;
    const body = document.body;
    const scrollbarWidth = Math.max(
      0,
      window.innerWidth - html.clientWidth,
    );

    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyPaddingRight = body.style.paddingRight;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      const currentPaddingRight = Number.parseFloat(
        window.getComputedStyle(body).paddingRight,
      ) || 0;

      body.style.paddingRight = `${currentPaddingRight + scrollbarWidth}px`;
    }

    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.paddingRight = previousBodyPaddingRight;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[70]">
          <motion.button
            type="button"
            aria-label="Cerrar configuración"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="reports-drawer-backdrop absolute inset-0"
          />

          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "spring",
              stiffness: 360,
              damping: 38,
            }}
            className="reports-drawer absolute right-0 top-0 flex h-full w-full max-w-[620px] flex-col"
          >
            <div className="reports-drawer-header flex items-start justify-between gap-5 px-5 py-5 sm:px-7 sm:py-6">
              <div>
                <h2 className="text-[20px] font-semibold tracking-[-0.035em]">
                  {title}
                </h2>
                <p className="mt-1 max-w-md text-xs leading-5 text-(--text-tertiary)">
                  {description}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="reports-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                aria-label="Cerrar"
              >
                <X size={15} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-28 sm:px-7">
              {children}
            </div>

            <div className="reports-drawer-footer absolute bottom-0 left-0 right-0 px-5 py-4 sm:px-7">
              <Button
                size="md"
                className="w-full rounded-full"
                onClick={onClose}
              >
                Listo
              </Button>
            </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

function SettingRow({
  icon,
  title,
  value,
  detail,
  action,
  onClick,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  detail?: string;
  action?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="reports-setting-row grid gap-4 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5">
      <div className="flex min-w-0 items-start gap-3.5">
        <span className="reports-setting-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px]">
          {icon}
        </span>

        <div className="min-w-0">
          <div className="text-[11px] font-medium text-(--text-tertiary)">
            {title}
          </div>
          <div className="mt-0.5 truncate text-[14px] font-semibold tracking-[-0.015em]">
            {value}
          </div>
          {detail ? (
            <div className="mt-1 text-[11px] leading-4 text-(--text-tertiary)">
              {detail}
            </div>
          ) : null}
        </div>
      </div>

      {children ??
        (onClick ? (
          <button
            type="button"
            onClick={onClick}
            className="reports-setting-action inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-semibold"
          >
            {action ?? "Editar"}
            <ChevronRight size={13} />
          </button>
        ) : null)}
    </div>
  );
}

function DrawerSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="reports-drawer-section py-5">
      <div className="mb-3">
        <h3 className="text-[12px] font-semibold tracking-[-0.01em]">
          {title}
        </h3>
        {description ? (
          <p className="mt-1 text-[10px] leading-4 text-(--text-tertiary)">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function ReportConfigurator({
  options,
  draft,
  onChange,
  onPreview,
  loadingPreview,
}: ReportConfiguratorProps) {
  const [editor, setEditor] =
    useState<EditorKey | null>(null);
  const [activePresetId, setActivePresetId] =
    useState<PresetId | null>("general");
  const [branchSearch, setBranchSearch] =
    useState("");

  const managerLocked =
    options.scope.accessMode === "manager";

  const allCountryCodes =
    useMemo(
      () =>
        options.scope.countries.map(
          (country) => country.code,
        ),
      [options.scope.countries],
    );

  const visibleRegions = useMemo(
    () =>
      options.scope.regions.filter((region) =>
        draft.scope.countryCodes.includes(
          region.countryCode,
        ),
      ),
    [
      draft.scope.countryCodes,
      options.scope.regions,
    ],
  );

  const visibleBranches = useMemo(() => {
    const normalizedSearch = branchSearch
      .trim()
      .toLocaleLowerCase("es-MX");

    return options.scope.branches.filter(
      (branch) => {
        if (
          !branchAllowedByGeography(
            branch,
            draft,
          )
        ) {
          return false;
        }

        if (
          !draft.scope.includeInactiveBranches &&
          !branch.activa
        ) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        return [
          branch.nombre,
          branch.codigo,
          branch.region ?? "",
        ]
          .join(" ")
          .toLocaleLowerCase("es-MX")
          .includes(normalizedSearch);
      },
    );
  }, [
    branchSearch,
    draft,
    options.scope.branches,
  ]);

  const globalScope =
    !managerLocked &&
    draft.scope.regions.length === 0 &&
    draft.scope.branchIds.length === 0 &&
    allCountryCodes.length > 0 &&
    allCountryCodes.every((code) =>
      draft.scope.countryCodes.includes(code),
    ) &&
    draft.scope.countryCodes.every((code) =>
      allCountryCodes.includes(code),
    );

  const appliedFilterCount = [
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

  const scopeSummary = managerLocked
    ? options.scope.branches[0]?.nombre ??
      "Sucursal asignada"
    : globalScope
      ? "Todo el inventario"
      : draft.scope.branchIds.length > 0
        ? `${draft.scope.branchIds.length} sucursal${draft.scope.branchIds.length === 1 ? "" : "es"}`
        : draft.scope.regions.length > 0
          ? `${draft.scope.regions.length} región${draft.scope.regions.length === 1 ? "" : "es"}`
          : draft.scope.countryCodes
              .map(
                (code) =>
                  options.scope.countries.find(
                    (country) => country.code === code,
                  )?.label ?? code,
              )
              .join(" · ");

  const scopeDetail = managerLocked
    ? "Alcance fijado por tu sucursal asignada."
    : globalScope
      ? `${options.scope.branches.filter((branch) => branch.activa).length} sucursales activas dentro de tu alcance.`
      : draft.scope.branchIds.length > 0
        ? "Solo se incluirán las sucursales seleccionadas."
        : "Se incluirán todas las sucursales que coincidan con la geografía elegida.";

  const columnCount =
    draft.columns.mode === "all"
      ? REPORT_COLUMNS.length
      : draft.columns.values.length;

  const columnSummary =
    draft.columns.mode === "all"
      ? "Todas las columnas"
      : `${columnCount} columnas`;

  const columnDetail =
    draft.columns.mode === "all"
      ? "Incluye todos los campos de negocio disponibles."
      : draft.columns.values
          .slice(0, 4)
          .map((key) => REPORT_COLUMN_LABELS[key])
          .join(" · ") +
        (columnCount > 4
          ? ` · +${columnCount - 4}`
          : "");

  const groupingSecondary =
    secondaryGroupingLabel(
      draft.grouping.secondary,
    );

  const groupingSummary =
    draft.grouping.geographic
      ? "Por ubicación"
      : groupingSecondary
        ? `Por ${groupingSecondary}`
        : "Sin agrupación";

  const groupingDetail = draft.grouping.geographic
    ? groupingSecondary
      ? `País → región → sucursal; después ${groupingSecondary.toLocaleLowerCase("es-MX")}.`
      : "País → región → sucursal."
    : groupingSecondary
      ? `Separa el resultado por ${groupingSecondary.toLocaleLowerCase("es-MX")}.`
      : "Muestra una tabla continua.";

  function updateDraft(
    patch: Partial<ReportDraft>,
  ) {
    setActivePresetId(null);
    onChange({
      ...draft,
      ...patch,
    });
  }

  function updateScope(
    patch: Partial<ReportDraft["scope"]>,
  ) {
    setActivePresetId(null);
    onChange({
      ...draft,
      scope: {
        ...draft.scope,
        ...patch,
      },
    });
  }

  function updateFilters(
    patch: Partial<ReportDraft["filters"]>,
  ) {
    setActivePresetId(null);
    onChange({
      ...draft,
      filters: {
        ...draft.filters,
        ...patch,
      },
    });
  }

  function applyPreset(preset: ReportPreset) {
    setActivePresetId(preset.id);
    onChange(preset.apply(draft));
  }

  function resetScope() {
    updateScope({
      countryCodes:
        allCountryCodes.length > 0
          ? allCountryCodes
          : options.scope.defaultCountryCodes,
      regions: [],
      branchIds: [],
    });
  }

  function toggleCountry(code: ReportCountryCode) {
    if (managerLocked) {
      return;
    }

    const exists =
      draft.scope.countryCodes.includes(code);

    if (
      exists &&
      draft.scope.countryCodes.length === 1
    ) {
      return;
    }

    const countryCodes = exists
      ? draft.scope.countryCodes.filter(
          (item) => item !== code,
        )
      : [...draft.scope.countryCodes, code];

    const regions = draft.scope.regions.filter(
      (region) =>
        countryCodes.includes(region.countryCode),
    );

    const branchIds = draft.scope.branchIds.filter(
      (id) => {
        const branch = options.scope.branches.find(
          (item) => item.id === id,
        );

        return (
          !branch?.countryCode ||
          countryCodes.includes(branch.countryCode)
        );
      },
    );

    updateScope({
      countryCodes,
      regions,
      branchIds,
    });
  }

  function toggleRegion(
    region: ReportRegionSelection,
  ) {
    if (managerLocked) {
      return;
    }

    const exists = draft.scope.regions.some(
      (item) => sameRegion(item, region),
    );

    const regions = exists
      ? draft.scope.regions.filter(
          (item) => !sameRegion(item, region),
        )
      : [...draft.scope.regions, region];

    const branchIds = draft.scope.branchIds.filter(
      (id) => {
        if (regions.length === 0) {
          return true;
        }

        const branch = options.scope.branches.find(
          (item) => item.id === id,
        );

        if (!branch?.countryCode || !branch.region) {
          return false;
        }

        return regions.some(
          (selectedRegion) =>
            selectedRegion.countryCode ===
              branch.countryCode &&
            selectedRegion.name === branch.region,
        );
      },
    );

    updateScope({ regions, branchIds });
  }

  function toggleBranch(id: string) {
    if (managerLocked) {
      return;
    }

    updateScope({
      branchIds: toggleValue(
        draft.scope.branchIds,
        id,
      ),
    });
  }

  function setIncludeInactive(
    includeInactiveBranches: boolean,
  ) {
    const branchIds = includeInactiveBranches
      ? draft.scope.branchIds
      : draft.scope.branchIds.filter(
          (id) =>
            options.scope.branches.find(
              (branch) => branch.id === id,
            )?.activa !== false,
        );

    updateScope({
      includeInactiveBranches,
      branchIds,
    });
  }

  function toggleColumn(key: ReportColumnKey) {
    if (key === "inventoryNumber") {
      return;
    }

    const current =
      draft.columns.mode === "selected"
        ? draft.columns.values
        : REPORT_COLUMNS.map((column) => column.key);

    const values = current.includes(key)
      ? current.filter((item) => item !== key)
      : [...current, key];

    updateDraft({
      columns: {
        mode: "selected",
        values:
          values.length > 0
            ? values
            : ["inventoryNumber"],
      },
    });
  }

  function clearFilters() {
    setActivePresetId(null);
    onChange({
      ...draft,
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
        ...draft.date,
        enabled: false,
        from: "",
        to: "",
      },
    });
  }

  const incompleteGeographyCount =
    options.scope.warnings
      .flatMap((warning) => warning.branchIds)
      .filter(
        (id, index, values) =>
          values.indexOf(id) === index,
      ).length;

  return (
    <div className="space-y-4">
      <section className="reports-presets-v2 rounded-[26px] p-4 sm:p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[12px] font-semibold">
              <Sparkles size={15} />
              ¿Qué necesitas?
            </div>
            <p className="mt-1 text-[11px] leading-5 text-(--text-tertiary)">
              Empieza con una configuración útil y ajusta solo lo necesario.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {REPORT_PRESETS.map((preset) => {
            const active = activePresetId === preset.id;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className={cn(
                  "reports-preset-card flex min-h-[74px] items-start gap-3 rounded-[18px] p-3 text-left transition",
                  active && "reports-preset-card-active",
                )}
              >
                <span className="reports-preset-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px]">
                  {presetIcon(preset.id)}
                </span>
                <span className="min-w-0">
                  <span className="block text-[12px] font-semibold">
                    {preset.name}
                  </span>
                  <span className="mt-1 block text-[10px] leading-4 text-(--text-tertiary)">
                    {preset.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="reports-config-v2 overflow-hidden rounded-[28px]">
        <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-[15px] font-semibold tracking-[-0.02em]">
              Configuración
            </h2>
            <p className="mt-0.5 text-[11px] text-(--text-tertiary)">
              Lo esencial queda visible; el detalle aparece solo cuando lo necesitas.
            </p>
          </div>
          <div className="hidden items-center gap-2 text-[10px] text-(--text-tertiary) sm:flex">
            <BriefcaseBusiness size={13} />
            Listo para consultar
          </div>
        </div>

        <div className="reports-settings-list">
          <SettingRow
            icon={<Globe2 size={16} />}
            title="Alcance"
            value={scopeSummary || "Sin alcance"}
            detail={scopeDetail}
            action={managerLocked ? "Ver" : "Cambiar"}
            onClick={() => setEditor("scope")}
          />

          <SettingRow
            icon={<PackageCheck size={16} />}
            title="Equipos"
            value={assetStatusLabel(draft.assetStatus)}
            detail="Define si el reporte toma activos, inactivos o ambos."
          >
            <div className="reports-mini-segmented grid grid-cols-3 rounded-full p-1">
              {(
                [
                  ["active", "Activos"],
                  ["inactive", "Inactivos"],
                  ["all", "Todos"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    updateDraft({ assetStatus: value })
                  }
                  className={cn(
                    "rounded-full px-2.5 py-1.5 text-[10px] font-semibold transition",
                    draft.assetStatus === value &&
                      "reports-mini-segmented-active",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </SettingRow>

          <SettingRow
            icon={<Filter size={16} />}
            title="Filtros"
            value={
              appliedFilterCount === 0
                ? "Sin filtros adicionales"
                : `${appliedFilterCount} filtro${appliedFilterCount === 1 ? "" : "s"} aplicado${appliedFilterCount === 1 ? "" : "s"}`
            }
            detail={
              appliedFilterCount === 0
                ? "Añádelos solo si necesitas acotar el resultado."
                : "Puedes revisar o quitar los criterios sin perder el resto de la configuración."
            }
            action={
              appliedFilterCount === 0 ? "Añadir" : "Editar"
            }
            onClick={() => setEditor("filters")}
          />

          <SettingRow
            icon={<FileSliders size={16} />}
            title="Contenido"
            value={columnSummary}
            detail={columnDetail}
            onClick={() => setEditor("columns")}
          />

          <SettingRow
            icon={<Layers3 size={16} />}
            title="Organización"
            value={groupingSummary}
            detail={groupingDetail}
            onClick={() => setEditor("grouping")}
          />
        </div>

        {incompleteGeographyCount > 0 ? (
          <div className="reports-geo-note mx-4 mb-4 rounded-[18px] px-3.5 py-3 text-[10px] leading-4 sm:mx-5">
            <strong>{incompleteGeographyCount}</strong>{" "}
            sucursal{incompleteGeographyCount === 1 ? "" : "es"} todavía no tiene{incompleteGeographyCount === 1 ? "" : "n"} geografía completa. En alcance global seguirá{incompleteGeographyCount === 1 ? "" : "n"} incluida{incompleteGeographyCount === 1 ? "" : "s"}; al filtrar por país o región solo entran sucursales cuya ubicación puede comprobarse.
          </div>
        ) : null}

        <div className="reports-config-footer flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <div className="text-[11px] font-semibold">
              Configuración lista
            </div>
            <div className="mt-0.5 text-[10px] text-(--text-tertiary)">
              La vista previa consulta PostgreSQL respetando tu alcance autorizado.
            </div>
          </div>

          <Button
            size="md"
            loading={loadingPreview}
            leftIcon={<Sparkles size={16} />}
            onClick={onPreview}
            className="w-full rounded-full sm:w-auto"
          >
            Generar vista previa
          </Button>
        </div>
      </section>

      <EditorDrawer
        open={editor === "scope"}
        onClose={() => setEditor(null)}
        title="Alcance"
        description="Decide dónde mirar sin perder de vista las sucursales que realmente quedarán incluidas."
      >
        {managerLocked ? (
          <DrawerSection
            title="Sucursal asignada"
            description="El alcance de un gerente se fija desde permisos y no puede ampliarse desde Reportes."
          >
            <div className="reports-summary-box rounded-[18px] p-4">
              <div className="text-sm font-semibold">
                {options.scope.branches[0]?.nombre ??
                  "Sucursal asignada"}
              </div>
              <div className="mt-1 text-xs text-(--text-tertiary)">
                {options.scope.branches[0]?.codigo ?? ""}
              </div>
            </div>
          </DrawerSection>
        ) : (
          <>
            <DrawerSection
              title="Vista rápida"
              description="Si no necesitas acotar la geografía, deja todo el inventario seleccionado."
            >
              <button
                type="button"
                onClick={resetScope}
                className={cn(
                  "reports-scope-all flex w-full items-center justify-between gap-4 rounded-[18px] px-4 py-3.5 text-left",
                  globalScope && "reports-scope-all-active",
                )}
              >
                <span>
                  <span className="block text-[13px] font-semibold">
                    Todo el inventario
                  </span>
                  <span className="mt-1 block text-[10px] leading-4 text-(--text-tertiary)">
                    Incluye todas las sucursales activas de tu alcance, incluso las pendientes de geografía cuando el reporte es global.
                  </span>
                </span>
                {globalScope ? (
                  <Check size={16} />
                ) : (
                  <RotateCcw size={15} />
                )}
              </button>
            </DrawerSection>

            <DrawerSection
              title="País"
              description="Selecciona uno o más países. Siempre debe quedar al menos uno."
            >
              <div className="grid gap-2 sm:grid-cols-2">
                {options.scope.countries.map((country) => {
                  const active =
                    draft.scope.countryCodes.includes(
                      country.code,
                    );

                  return (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() =>
                        toggleCountry(country.code)
                      }
                      className={cn(
                        "reports-option flex items-center justify-between rounded-[16px] px-4 py-3 text-left",
                        active && "reports-option-active",
                      )}
                    >
                      <span>
                        <span className="block text-[13px] font-semibold">
                          {country.label}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-(--text-tertiary)">
                          {country.branchCount} sucursales con geografía conocida
                        </span>
                      </span>
                      <span
                        className={cn(
                          "reports-check-dot flex h-5 w-5 items-center justify-center rounded-full border",
                          active && "reports-check-dot-active",
                        )}
                      >
                        <Check size={12} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </DrawerSection>

            <DrawerSection
              title="Región"
              description="Déjalo sin selección para incluir todas las regiones de los países elegidos."
            >
              <MultiOptionList
                items={visibleRegions.map((region) => ({
                  value: `${region.countryCode}::${region.name}`,
                  label: region.name,
                  detail: region.countryCode,
                }))}
                selected={draft.scope.regions.map(
                  (region) =>
                    `${region.countryCode}::${region.name}`,
                )}
                onToggle={(value) => {
                  const [countryCode, ...nameParts] =
                    value.split("::");
                  const name = nameParts.join("::");

                  toggleRegion({
                    countryCode:
                      countryCode as ReportCountryCode,
                    name,
                  });
                }}
                emptyLabel="No hay regiones disponibles para el país seleccionado."
              />
            </DrawerSection>

            <DrawerSection
              title="Sucursal"
              description="Si no eliges sucursales concretas, se incluyen todas las que coincidan con país y región."
            >
              <label className="reports-search-box mb-3 flex items-center gap-2 rounded-[15px] px-3 py-2.5">
                <Search size={14} />
                <input
                  value={branchSearch}
                  onChange={(event) =>
                    setBranchSearch(event.target.value)
                  }
                  placeholder="Buscar sucursal..."
                  className="min-w-0 flex-1 bg-transparent text-xs outline-none"
                />
              </label>

              <MultiOptionList
                items={visibleBranches.map((branch) => ({
                  value: branch.id,
                  label: branch.nombre,
                  detail: [
                    branch.codigo,
                    branch.region,
                    branch.activa ? null : "Inactiva",
                  ]
                    .filter(Boolean)
                    .join(" · "),
                }))}
                selected={draft.scope.branchIds}
                onToggle={toggleBranch}
                emptyLabel="No hay sucursales que coincidan con este alcance."
              />
            </DrawerSection>

            <DrawerSection title="Sucursales inactivas">
              <button
                type="button"
                role="switch"
                aria-checked={
                  draft.scope.includeInactiveBranches
                }
                onClick={() =>
                  setIncludeInactive(
                    !draft.scope.includeInactiveBranches,
                  )
                }
                className="reports-switch-row flex w-full items-center justify-between gap-5 rounded-[18px] px-4 py-3.5 text-left"
              >
                <span>
                  <span className="block text-[12px] font-semibold">
                    Incluir sucursales inactivas
                  </span>
                  <span className="mt-1 block text-[10px] leading-4 text-(--text-tertiary)">
                    Úsalo solo cuando el reporte necesite contexto histórico de sucursales cerradas o deshabilitadas.
                  </span>
                </span>
                <span
                  className={cn(
                    "reports-switch relative h-[26px] w-[45px] shrink-0 rounded-full",
                    draft.scope.includeInactiveBranches &&
                      "reports-switch-active",
                  )}
                >
                  <span className="absolute left-[3px] top-[3px] h-5 w-5 rounded-full bg-white shadow-sm transition-transform data-[on=true]:translate-x-[19px]" data-on={draft.scope.includeInactiveBranches} />
                </span>
              </button>
            </DrawerSection>
          </>
        )}
      </EditorDrawer>

      <EditorDrawer
        open={editor === "filters"}
        onClose={() => setEditor(null)}
        title="Filtros"
        description="Acota el reporte solo cuando una pregunta de negocio realmente lo requiera."
      >
        {appliedFilterCount > 0 ? (
          <div className="pt-4">
            <button
              type="button"
              onClick={clearFilters}
              className="reports-clear-action inline-flex items-center gap-2 rounded-full px-3 py-2 text-[11px] font-semibold"
            >
              <RotateCcw size={13} />
              Limpiar filtros
            </button>
          </div>
        ) : null}

        <DrawerSection title="Tipo de equipo">
          <MultiOptionList
            items={catalogItems(
              options.filters.equipmentTypes,
            )}
            selected={draft.filters.equipmentTypeCodes}
            onToggle={(value) =>
              updateFilters({
                equipmentTypeCodes: toggleValue(
                  draft.filters.equipmentTypeCodes,
                  value,
                ),
              })
            }
            emptyLabel="No hay tipos disponibles."
          />
        </DrawerSection>

        <DrawerSection title="Departamento">
          <MultiOptionList
            items={catalogIdItems(
              options.filters.departments,
            )}
            selected={draft.filters.departmentIds}
            onToggle={(value) =>
              updateFilters({
                departmentIds: toggleValue(
                  draft.filters.departmentIds,
                  value,
                ),
              })
            }
            emptyLabel="No hay departamentos disponibles."
          />
        </DrawerSection>

        <DrawerSection title="Funcionamiento">
          <MultiOptionList
            items={catalogItems(
              options.filters.operatingStatuses,
            )}
            selected={draft.filters.operatingStatusCodes}
            onToggle={(value) =>
              updateFilters({
                operatingStatusCodes: toggleValue(
                  draft.filters.operatingStatusCodes,
                  value,
                ),
              })
            }
            emptyLabel="No hay estados disponibles."
          />
        </DrawerSection>

        <DrawerSection title="Condición física">
          <MultiOptionList
            items={catalogItems(
              options.filters.physicalConditions,
            )}
            selected={draft.filters.physicalConditionCodes}
            onToggle={(value) =>
              updateFilters({
                physicalConditionCodes: toggleValue(
                  draft.filters.physicalConditionCodes,
                  value,
                ),
              })
            }
            emptyLabel="No hay condiciones disponibles."
          />
        </DrawerSection>

        <DrawerSection title="Incorporación">
          <MultiOptionList
            items={catalogItems(
              options.filters.incorporationTypes,
            )}
            selected={draft.filters.incorporationTypeCodes}
            onToggle={(value) =>
              updateFilters({
                incorporationTypeCodes: toggleValue(
                  draft.filters.incorporationTypeCodes,
                  value,
                ),
              })
            }
            emptyLabel="No hay tipos de incorporación disponibles."
          />
        </DrawerSection>

        <DrawerSection title="Marca">
          <MultiOptionList
            items={options.filters.brands.map((brand) => ({
              value: brand,
              label: brand,
            }))}
            selected={draft.filters.brands}
            onToggle={(value) =>
              updateFilters({
                brands: toggleValue(
                  draft.filters.brands,
                  value,
                ),
              })
            }
            emptyLabel="No hay marcas disponibles."
          />
        </DrawerSection>

        <DrawerSection
          title="Responsable"
          description="Filtra por la existencia de una persona responsable asignada."
        >
          <div className="reports-three-choice grid grid-cols-3 rounded-[17px] p-1">
            {(
              [
                ["all", "Todos"],
                ["assigned", "Asignados"],
                ["unassigned", "Sin asignar"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  updateFilters({ responsibility: value })
                }
                className={cn(
                  "rounded-[13px] px-2 py-2.5 text-[11px] font-semibold",
                  draft.filters.responsibility === value &&
                    "reports-three-choice-active",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </DrawerSection>

        <DrawerSection
          title="Requiere atención"
          description="Criterios operativos predefinidos; puedes combinar varios."
        >
          <MultiOptionList
            items={DATA_ISSUE_OPTIONS.map((item) => ({
              value: item.value,
              label: item.label,
              detail: item.description,
            }))}
            selected={draft.filters.dataIssues}
            onToggle={(value) =>
              updateFilters({
                dataIssues: toggleValue(
                  draft.filters.dataIssues,
                  value,
                ) as ReportDraft["filters"]["dataIssues"],
              })
            }
            emptyLabel="No hay criterios de atención disponibles."
          />
        </DrawerSection>

        <DrawerSection
          title="Periodo"
          description="Opcional. Filtra una fecha de alta, actualización, baja o reactivación."
        >
          <button
            type="button"
            role="switch"
            aria-checked={draft.date.enabled}
            onClick={() =>
              updateDraft({
                date: {
                  ...draft.date,
                  enabled: !draft.date.enabled,
                },
              })
            }
            className="reports-switch-row flex w-full items-center justify-between gap-5 rounded-[18px] px-4 py-3.5 text-left"
          >
            <span className="text-[12px] font-semibold">
              Usar filtro de fecha
            </span>
            <span
              className={cn(
                "reports-switch relative h-[26px] w-[45px] shrink-0 rounded-full",
                draft.date.enabled && "reports-switch-active",
              )}
            >
              <span className="absolute left-[3px] top-[3px] h-5 w-5 rounded-full bg-white shadow-sm transition-transform data-[on=true]:translate-x-[19px]" data-on={draft.date.enabled} />
            </span>
          </button>

          {draft.date.enabled ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label>
                <span className="reports-field-label">Campo</span>
                <select
                  value={draft.date.field}
                  onChange={(event) =>
                    updateDraft({
                      date: {
                        ...draft.date,
                        field:
                          event.target.value as ReportDraft["date"]["field"],
                      },
                    })
                  }
                  className="reports-field"
                >
                  {DATE_FIELD_OPTIONS.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="reports-field-label">Desde</span>
                <input
                  type="date"
                  value={draft.date.from}
                  onChange={(event) =>
                    updateDraft({
                      date: {
                        ...draft.date,
                        from: event.target.value,
                      },
                    })
                  }
                  className="reports-field"
                />
              </label>

              <label>
                <span className="reports-field-label">Hasta</span>
                <input
                  type="date"
                  value={draft.date.to}
                  onChange={(event) =>
                    updateDraft({
                      date: {
                        ...draft.date,
                        to: event.target.value,
                      },
                    })
                  }
                  className="reports-field"
                />
              </label>
            </div>
          ) : null}
        </DrawerSection>
      </EditorDrawer>

      <EditorDrawer
        open={editor === "columns"}
        onClose={() => setEditor(null)}
        title="Contenido"
        description="Decide qué datos viajarán en el reporte sin convertir la pantalla principal en una matriz de opciones."
      >
        <DrawerSection title="Modo">
          <div className="reports-three-choice grid grid-cols-2 rounded-[17px] p-1">
            <button
              type="button"
              onClick={() =>
                updateDraft({
                  columns: {
                    mode: "selected",
                    values: DEFAULT_REPORT_COLUMNS,
                  },
                })
              }
              className={cn(
                "rounded-[13px] px-3 py-2.5 text-[11px] font-semibold",
                draft.columns.mode === "selected" &&
                  "reports-three-choice-active",
              )}
            >
              Seleccionadas
            </button>
            <button
              type="button"
              onClick={() =>
                updateDraft({
                  columns: { mode: "all" },
                })
              }
              className={cn(
                "rounded-[13px] px-3 py-2.5 text-[11px] font-semibold",
                draft.columns.mode === "all" &&
                  "reports-three-choice-active",
              )}
            >
              Todas
            </button>
          </div>
        </DrawerSection>

        {draft.columns.mode === "selected" ? (
          <>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() =>
                  updateDraft({
                    columns: {
                      mode: "selected",
                      values: DEFAULT_REPORT_COLUMNS,
                    },
                  })
                }
                className="reports-clear-action inline-flex items-center gap-2 rounded-full px-3 py-2 text-[11px] font-semibold"
              >
                <RotateCcw size={13} />
                Volver a recomendadas
              </button>
            </div>

            {[
              "Identidad",
              "Ubicación",
              "Asignación",
              "Estado",
              "Compra",
              "Ciclo de vida",
            ].map((group) => (
              <DrawerSection key={group} title={group}>
                <div className="grid gap-x-5 gap-y-3 sm:grid-cols-2">
                  {REPORT_COLUMNS.filter(
                    (column) => column.group === group,
                  ).map((column) => {
                    const checked =
                      draft.columns.mode === "selected" &&
                      draft.columns.values.includes(column.key);

                    return (
                      <Checkbox
                        key={column.key}
                        label={column.label}
                        checked={checked}
                        disabled={
                          column.key === "inventoryNumber"
                        }
                        onChange={() =>
                          toggleColumn(column.key)
                        }
                      />
                    );
                  })}
                </div>
              </DrawerSection>
            ))}
          </>
        ) : (
          <div className="reports-info-strip mt-4 rounded-[18px] px-4 py-3 text-xs leading-5 text-(--text-secondary)">
            “Todas” incluye todos los campos de negocio permitidos por Reportes; nunca expone columnas internas de PostgreSQL.
          </div>
        )}
      </EditorDrawer>

      <EditorDrawer
        open={editor === "grouping"}
        onClose={() => setEditor(null)}
        title="Organización"
        description="Define cómo se presenta el resultado. Esto no cambia qué equipos entran al reporte."
      >
        <DrawerSection
          title="Agrupación principal"
          description="La agrupación geográfica organiza automáticamente País → Región → Sucursal."
        >
          <button
            type="button"
            role="switch"
            aria-checked={draft.grouping.geographic}
            onClick={() =>
              updateDraft({
                grouping: {
                  ...draft.grouping,
                  geographic: !draft.grouping.geographic,
                },
              })
            }
            className="reports-switch-row flex w-full items-center justify-between gap-5 rounded-[18px] px-4 py-3.5 text-left"
          >
            <span>
              <span className="block text-[12px] font-semibold">
                Organizar por ubicación
              </span>
              <span className="mt-1 block text-[10px] leading-4 text-(--text-tertiary)">
                Hace más fácil leer reportes con varias sucursales.
              </span>
            </span>
            <span
              className={cn(
                "reports-switch relative h-[26px] w-[45px] shrink-0 rounded-full",
                draft.grouping.geographic &&
                  "reports-switch-active",
              )}
            >
              <span className="absolute left-[3px] top-[3px] h-5 w-5 rounded-full bg-white shadow-sm transition-transform data-[on=true]:translate-x-[19px]" data-on={draft.grouping.geographic} />
            </span>
          </button>
        </DrawerSection>

        <DrawerSection
          title="Separar además por"
          description="Opcional. Añade una segunda lectura al reporte sin modificar sus filtros."
        >
          <select
            value={draft.grouping.secondary ?? ""}
            onChange={(event) => {
              const value = event.target.value;

              updateDraft({
                grouping: {
                  ...draft.grouping,
                  ...(value
                    ? {
                        secondary:
                          value as NonNullable<
                            ReportDraft["grouping"]["secondary"]
                          >,
                      }
                    : { secondary: undefined }),
                },
              });
            }}
            className="reports-field"
          >
            <option value="">Ninguna</option>
            {SECONDARY_GROUP_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </DrawerSection>

        <div className="reports-info-strip mt-4 rounded-[18px] px-4 py-3 text-xs leading-5 text-(--text-secondary)">
          {groupingDetail}
        </div>
      </EditorDrawer>
    </div>
  );
}
