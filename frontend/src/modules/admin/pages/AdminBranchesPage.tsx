
import {
  ArrowLeft,
  Building2,
  Power,
  RotateCcw,
  Users,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../../components/ui/Button";
import { Sheet } from "../../../components/ui/Sheet";
import { Spinner } from "../../../components/ui/Spinner";
import { useToast } from "../../../components/ui/ToastProvider";
import { useAutoRefresh } from "../../../hooks/useAutoRefresh";
import { InventoryShell } from "../../inventory/components/InventoryShell";
import {
  getAdminBranches,
  updateAdminBranchStatus,
} from "../services/admin.service";
import type { AdminBranch } from "../types/admin.types";

export function AdminBranchesPage() {
  const navigate = useNavigate();
  const { pushToast } = useToast();

  const [branches, setBranches] =
    useState<AdminBranch[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [selected, setSelected] =
    useState<AdminBranch | null>(null);
  const [saving, setSaving] =
    useState(false);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);

      try {
        setBranches(
          await getAdminBranches(),
        );
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useAutoRefresh(
    () => load(true),
    { intervalMs: 30_000 },
  );

  const summary = useMemo(
    () => ({
      active: branches.filter(
        (branch) => branch.activa,
      ).length,
      inactive: branches.filter(
        (branch) => !branch.activa,
      ).length,
    }),
    [branches],
  );

  async function confirmStatus() {
    if (!selected) return;

    const next = !selected.activa;
    setSaving(true);

    try {
      await updateAdminBranchStatus(
        selected.id,
        next,
      );

      pushToast({
        tone: "success",
        title: next
          ? "Sucursal reactivada"
          : "Sucursal desactivada",
      });

      setSelected(null);
      await load(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <InventoryShell>
      <main className="mx-auto max-w-[1180px] px-4 pb-20 sm:px-6">
        <button
          type="button"
          onClick={() => navigate("/admin")}
          className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-(--text-secondary)"
        >
          <ArrowLeft size={15} />
          Usuarios y acceso
        </button>

        <section className="pt-8">
          <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-(--text-tertiary)">
            Administración · sucursales
          </div>

          <h1 className="mt-3 text-[clamp(3.2rem,6vw,5.8rem)] font-semibold leading-[0.92] tracking-[-0.07em]">
            Ciclo operativo.
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-(--text-secondary)">
            Desactivar una sucursal detiene nuevas operaciones, pero conserva usuarios, equipos e historial. Puedes reactivarla cuando vuelva a operar.
          </p>
        </section>

        <section className="mt-8 grid gap-3 sm:grid-cols-3">
          <Metric label="Sucursales" value={branches.length} />
          <Metric label="Activas" value={summary.active} />
          <Metric label="Inactivas" value={summary.inactive} />
        </section>

        <section className="mt-6 overflow-hidden rounded-[28px] border border-black/[0.055] bg-white/72 shadow-sm backdrop-blur-xl">
          {loading ? (
            <div className="flex min-h-52 items-center justify-center">
              <Spinner className="text-(--accent)" />
            </div>
          ) : branches.length === 0 ? (
            <div className="p-10 text-center text-sm text-(--text-secondary)">
              No hay sucursales configuradas.
            </div>
          ) : (
            branches.map((branch) => (
              <button
                key={branch.id}
                type="button"
                onClick={() => setSelected(branch)}
                className="grid w-full grid-cols-[1fr_auto] items-center gap-4 border-b border-black/[0.055] p-5 text-left transition last:border-0 hover:bg-black/[0.025] lg:grid-cols-[1.2fr_.7fr_.7fr_.7fr_auto]"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">
                      {branch.nombre}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] ${
                        branch.activa
                          ? "bg-emerald-500/10 text-emerald-700"
                          : "bg-black/[0.055] text-(--text-tertiary)"
                      }`}
                    >
                      {branch.activa ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-(--text-tertiary)">
                    {branch.codigo}
                    {branch.ciudad
                      ? ` · ${branch.ciudad}`
                      : " · Ubicación no configurada"}
                  </div>
                </div>

                <Stat icon={Building2} label="Equipos" value={branch.equiposTotal} />
                <Stat icon={Power} label="Activos" value={branch.equiposActivos} />
                <Stat icon={Users} label="Usuarios" value={branch.usuariosAsignados} />

                <span className="text-xs font-semibold text-(--accent)">
                  {branch.activa ? "Desactivar" : "Reactivar"}
                </span>
              </button>
            ))
          )}
        </section>

        <Sheet
          open={Boolean(selected)}
          onClose={() => setSelected(null)}
          title={
            selected?.activa
              ? "Desactivar sucursal"
              : "Reactivar sucursal"
          }
        >
          {selected ? (
            <div className="space-y-6">
              <div>
                <div className="text-lg font-semibold">
                  {selected.nombre}
                </div>
                <div className="mt-1 text-sm text-(--text-secondary)">
                  {selected.codigo}
                </div>
              </div>

              <div className="rounded-[20px] bg-black/[0.035] p-4 text-xs leading-5 text-(--text-secondary)">
                {selected.activa
                  ? "Los registros históricos y las asignaciones de usuarios se conservarán. No se permitirán nuevas altas ni reactivaciones de equipos en esta sucursal mientras permanezca inactiva."
                  : "La sucursal volverá a estar disponible para nuevas capturas, movimientos y reactivaciones de equipos."}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Metric label="Equipos totales" value={selected.equiposTotal} />
                <Metric label="Usuarios asignados" value={selected.usuariosAsignados} />
              </div>

              <Button
                className="w-full"
                variant={selected.activa ? "danger" : "primary"}
                loading={saving}
                leftIcon={
                  selected.activa
                    ? <Power size={15} />
                    : <RotateCcw size={15} />
                }
                onClick={confirmStatus}
              >
                {selected.activa
                  ? "Confirmar desactivación"
                  : "Reactivar sucursal"}
              </Button>
            </div>
          ) : null}
        </Sheet>
      </main>
    </InventoryShell>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[22px] border border-black/[0.05] bg-white/62 p-4 shadow-sm backdrop-blur-xl">
      <div className="text-[10px] font-semibold uppercase tracking-[0.11em] text-(--text-tertiary)">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
        {value.toLocaleString("es-MX")}
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: number;
}) {
  return (
    <div className="hidden items-center gap-2 text-xs lg:flex">
      <Icon size={14} className="text-(--text-tertiary)" />
      <span className="text-(--text-tertiary)">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
