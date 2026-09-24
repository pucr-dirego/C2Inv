import {
  ArrowLeft,
  Edit3,
  History,
  Laptop2,
  Power,
  RotateCcw,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { Button } from "../../../components/ui/Button";
import { ChoiceField } from "../../../components/ui/ChoiceField";
import { Sheet } from "../../../components/ui/Sheet";
import { Spinner } from "../../../components/ui/Spinner";
import { TextArea } from "../../../components/ui/TextArea";
import { useAutoRefresh } from "../../../hooks/useAutoRefresh";
import { useToast } from "../../../components/ui/ToastProvider";
import { useAuth } from "../../auth/context/AuthContext";
import {
  deactivateEquipment,
  getDeactivationReasons,
  reactivateEquipment,
} from "../../forms/equipment/services/equipment.service";
import { InventoryShell } from "../components/InventoryShell";
import { getInventoryEquipment } from "../services/inventory.service";
import type { InventoryAsset } from "../types/inventory.types";

export function EquipmentDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { isManager } = useAuth();
  const { pushToast } = useToast();

  const [asset, setAsset] =
    useState<InventoryAsset | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [actionOpen, setActionOpen] =
    useState(false);

  const [reasons, setReasons] =
    useState<Array<{
      id: string;
      codigo: string;
      nombre: string;
      descripcion: string | null;
    }>>([]);

  const [reasonId, setReasonId] =
    useState("");

  const [detail, setDetail] =
    useState("");

  const load = useCallback(
    async (silent = false) => {
      if (!id) return;

      if (!silent) {
        setLoading(true);
      }

      try {
        setAsset(
          await getInventoryEquipment(
            id,
          ),
        );
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [id],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useAutoRefresh(
    () => load(true),
    {
      intervalMs: 30_000,
      enabled: Boolean(id),
    },
  );

  async function openDeactivate() {
    setReasons(
      await getDeactivationReasons(),
    );
    setActionOpen(true);
  }

  async function handleDeactivate() {
    if (!asset || !reasonId) {
      return;
    }

    await deactivateEquipment(
      asset.id,
      {
        motivoBajaId: reasonId,
        detalle: detail || undefined,
        version: asset.version,
      },
    );

    pushToast({
      tone: "success",
      title: "Equipo dado de baja",
    });

    setActionOpen(false);
    setReasonId("");
    setDetail("");
    await load(true);
  }

  async function handleReactivate() {
    if (!asset) return;

    await reactivateEquipment(
      asset.id,
      asset.version,
    );

    pushToast({
      tone: "success",
      title: "Equipo reactivado",
    });

    await load(true);
  }

  if (loading || !asset) {
    return (
      <InventoryShell>
        <div className="flex min-h-[70vh] items-center justify-center">
          <Spinner className="text-(--accent)" />
        </div>
      </InventoryShell>
    );
  }

  return (
    <InventoryShell>
      <main className="mx-auto max-w-[1180px] px-4 pb-16 sm:px-6">
        <button
          type="button"
          onClick={() =>
            navigate(-1)
          }
          className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-(--text-secondary)"
        >
          <ArrowLeft size={15} />
          Volver
        </button>

        <section className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-black text-white shadow-lg">
              <Laptop2
                size={24}
                strokeWidth={1.5}
              />
            </div>

            <h1 className="mt-5 text-[clamp(3rem,6vw,5.8rem)] font-semibold leading-[0.92] tracking-[-0.065em]">
              {[asset.marca, asset.modelo]
                .filter(Boolean)
                .join(" ")}
            </h1>

            <p className="mt-4 text-sm text-(--text-secondary)">
              {asset.numeroInventario}
              {" · "}
              {asset.numeroSerie}
            </p>
          </div>

          {isManager && (
            <div className="flex flex-wrap gap-2">
              {asset.activo ? (
                <>
                  <Button
                    variant="secondary"
                    leftIcon={
                      <Edit3 size={15} />
                    }
                    onClick={() =>
                      navigate(
                        `/inventory/equipment/${asset.id}/edit`,
                      )
                    }
                  >
                    Editar
                  </Button>

                  <Button
                    variant="danger"
                    leftIcon={
                      <Power size={15} />
                    }
                    onClick={
                      openDeactivate
                    }
                  >
                    Dar de baja
                  </Button>
                </>
              ) : (
                <Button
                  leftIcon={
                    <RotateCcw size={15} />
                  }
                  onClick={
                    handleReactivate
                  }
                >
                  Reactivar
                </Button>
              )}
            </div>
          )}
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-[28px] border border-black/[0.055] bg-white/76 p-6 shadow-sm backdrop-blur-xl">
            <h2 className="text-lg font-semibold tracking-[-0.03em]">
              Información
            </h2>

            <dl className="mt-6 grid gap-x-7 gap-y-5 sm:grid-cols-2">
              {[
                ["Tipo", asset.tipoNombre],
                ["Sucursal", asset.sucursalNombre],
                ["Departamento", asset.departamentoNombre],
                ["Responsable", asset.responsable || "Sin asignar"],
                ["Hostname", asset.hostname || "No aplica"],
                ["Dirección IP", asset.direccionIp || "No capturada"],
                ["Sistema operativo", asset.sistemaOperativo || "No capturado"],
                ["Estado", asset.activo ? asset.estadoNombre : "Baja"],
                ["Condición", asset.condicionNombre],
                ["Ubicación", asset.ubicacionExacta],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="border-b border-black/[0.055] pb-4"
                >
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-(--text-tertiary)">
                    {label}
                  </dt>

                  <dd className="mt-2 text-sm font-medium">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-[28px] border border-black/[0.055] bg-[#101114] p-6 text-white shadow-[0_25px_70px_rgba(0,0,0,.16)]">
            <div className="flex items-center gap-2">
              <History
                size={17}
                className="text-white/55"
              />

              <h2 className="text-lg font-semibold tracking-[-0.03em]">
                Historial
              </h2>
            </div>

            <div className="mt-6 space-y-5">
              {(asset.history ?? []).length ===
              0 ? (
                <div className="text-sm text-white/42">
                  Aún no hay movimientos registrados.
                </div>
              ) : (
                (asset.history ?? []).map(
                  (item) => (
                    <div
                      key={item.id}
                      className="relative border-l border-white/[0.12] pl-5"
                    >
                      <span className="absolute -left-[4.5px] top-1 h-2 w-2 rounded-full bg-blue-400" />

                      <div className="text-sm font-semibold capitalize">
                        {item.evento
                          .replaceAll(
                            "_",
                            " ",
                          )
                          .toLowerCase()}
                      </div>

                      <div className="mt-1 text-xs text-white/42">
                        {[
                          item.usuarioNombre,
                          item.usuarioApellidoPaterno,
                        ]
                          .filter(Boolean)
                          .join(" ") ||
                          "Sistema"}
                        {" · "}
                        {new Date(
                          item.creadoEn,
                        ).toLocaleString(
                          "es-MX",
                        )}
                      </div>

                      {item.detalle && (
                        <div className="mt-2 text-xs leading-5 text-white/55">
                          {item.detalle}
                        </div>
                      )}
                    </div>
                  ),
                )
              )}
            </div>
          </div>
        </section>

        <Sheet
          open={actionOpen}
          onClose={() =>
            setActionOpen(false)
          }
          title="Dar de baja equipo"
        >
          <p className="text-sm leading-6 text-(--text-secondary)">
            El registro se conservará y dejará de aparecer en el inventario activo.
          </p>

          <div className="mt-6 space-y-5">
            <ChoiceField
              label="Motivo"
              value={reasonId}
              onChange={setReasonId}
              placeholder="Selecciona un motivo"
              options={reasons.map(
                (reason) => ({
                  value: reason.id,
                  label: reason.nombre,
                  description:
                    reason.descripcion ??
                    undefined,
                }),
              )}
            />

            <TextArea
              label="Detalle"
              value={detail}
              onChange={(event) =>
                setDetail(
                  event.target.value,
                )
              }
              placeholder="Información adicional de la baja"
            />

            <Button
              variant="danger"
              className="w-full"
              disabled={!reasonId}
              onClick={
                handleDeactivate
              }
            >
              Confirmar baja
            </Button>
          </div>
        </Sheet>
      </main>
    </InventoryShell>
  );
}
