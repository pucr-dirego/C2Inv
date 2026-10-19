import {
  ArrowLeft,
  Save,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { Button } from "../../../../components/ui/Button";
import { ChoiceField } from "../../../../components/ui/ChoiceField";
import { Input } from "../../../../components/ui/Input";
import { Spinner } from "../../../../components/ui/Spinner";
import { TextArea } from "../../../../components/ui/TextArea";
import { useToast } from "../../../../components/ui/ToastProvider";
import { getInventoryEquipment } from "../../../inventory/services/inventory.service";
import { EquipmentInvoiceEditor } from "../components/EquipmentInvoiceEditor";
import type { InventoryAsset } from "../../../inventory/types/inventory.types";
import {
  getEquipmentCatalogs,
  updateEquipment,
} from "../services/equipment.service";
import type {
  EquipmentCatalogs,
  EquipmentFormValues,
} from "../types/equipment.types";

function withCurrentCatalogItem(
  items: EquipmentCatalogs["tiposEquipo"],
  current: {
    id: string;
    codigo: string;
    nombre: string;
  },
) {
  if (
    !current.id ||
    items.some(
      (item) => item.id === current.id,
    )
  ) {
    return items;
  }

  return [
    {
      ...current,
      activo: false,
      descripcion:
        "Valor actualmente asignado. Puede conservarse, pero ya no está disponible para nuevas asignaciones.",
    },
    ...items,
  ];
}

function emptyValues(): EquipmentFormValues {
  return {
    tipoEquipoId: "",
    marca: "",
    modelo: "",
    numeroSerie: "",
    hostname: "",
    direccionIp: "",
    sistemaOperativo: "",
    anydesk: "",
    estadoFuncionamientoId: "",
    condicionFisicaId: "",
    observaciones: "",
    sucursalId: "",
    departamentoId: "",
    responsable: "",
    ubicacionExacta: "",
    tipoIncorporacionId: "",
    facturaModo: "COMPLETAR_DESPUES",
    facturaExistenteId: "",
    facturaPartida: "",
    importeAdquisicion: null,
    factura: {
      numeroFactura: "",
      fechaFactura: "",
      proveedorNombre: "",
      razonSocial: "",
      moneda: "MXN",
      total: null,
      observaciones: "",
    },
  };
}

export function EquipmentEditPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { pushToast } = useToast();

  const [asset, setAsset] =
    useState<InventoryAsset | null>(
      null,
    );

  const [catalogs, setCatalogs] =
    useState<EquipmentCatalogs | null>(
      null,
    );

  const [values, setValues] =
    useState<EquipmentFormValues>(
      emptyValues(),
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    let mounted = true;

    void Promise.all([
      getInventoryEquipment(id),
      getEquipmentCatalogs(),
    ]).then(([equipment, data]) => {
      if (!mounted) return;

      setAsset(equipment);

      const hasCurrentInvoice =
        equipment.facturaId &&
        data.facturasCompra.some(
          (invoice) => invoice.id === equipment.facturaId,
        );

      const editCatalogs: EquipmentCatalogs = {
        ...data,
        sucursales:
          withCurrentCatalogItem(
            data.sucursales,
            {
              id: equipment.sucursalId,
              codigo:
                equipment.sucursalCodigo,
              nombre:
                equipment.sucursalNombre,
            },
          ),
        tiposEquipo:
          withCurrentCatalogItem(
            data.tiposEquipo,
            {
              id: equipment.tipoEquipoId,
              codigo:
                equipment.tipoCodigo,
              nombre:
                equipment.tipoNombre,
            },
          ),
        departamentos:
          withCurrentCatalogItem(
            data.departamentos,
            {
              id:
                equipment.departamentoId,
              codigo:
                equipment.departamentoCodigo,
              nombre:
                equipment.departamentoNombre,
            },
          ),
        estadosFuncionamiento:
          withCurrentCatalogItem(
            data.estadosFuncionamiento,
            {
              id: equipment.estadoId,
              codigo:
                equipment.estadoCodigo,
              nombre:
                equipment.estadoNombre,
            },
          ),
        condicionesFisicas:
          withCurrentCatalogItem(
            data.condicionesFisicas,
            {
              id:
                equipment.condicionId,
              codigo:
                equipment.condicionCodigo,
              nombre:
                equipment.condicionNombre,
            },
          ),
        tiposIncorporacion:
          withCurrentCatalogItem(
            data.tiposIncorporacion,
            {
              id:
                equipment.incorporacionId,
              codigo:
                equipment.incorporacionCodigo,
              nombre:
                equipment.incorporacionNombre,
            },
          ),
      };

      if (
        equipment.facturaId &&
        !hasCurrentInvoice
      ) {
        editCatalogs.facturasCompra = [
          {
            id: equipment.facturaId,
            numeroFactura:
              equipment.facturaNumero,
            fechaFactura:
              equipment.facturaFecha,
            proveedorNombre:
              equipment.facturaProveedor,
            razonSocial:
              equipment.facturaRazonSocial,
            moneda:
              equipment.facturaMoneda ??
              "MXN",
            total:
              equipment.facturaTotal,
          },
          ...data.facturasCompra,
        ];
      }

      setCatalogs(editCatalogs);

      setValues({
        ...emptyValues(),
        tipoEquipoId:
          equipment.tipoEquipoId,
        marca: equipment.marca,
        modelo:
          equipment.modelo ?? "",
        numeroSerie:
          equipment.numeroSerie,
        hostname:
          equipment.hostname ?? "",
        direccionIp:
          equipment.direccionIp ?? "",
        sistemaOperativo:
          equipment.sistemaOperativo ?? "",
        anydesk:
          equipment.anydesk ?? "",
        estadoFuncionamientoId:
          equipment.estadoId,
        condicionFisicaId:
          equipment.condicionId,
        observaciones:
          equipment.observaciones ?? "",
        sucursalId:
          equipment.sucursalId,
        departamentoId:
          equipment.departamentoId,
        responsable:
          equipment.responsable ?? "",
        ubicacionExacta:
          equipment.ubicacionExacta,
        tipoIncorporacionId:
          equipment.incorporacionId,
        facturaModo:
          equipment.facturaId
            ? "ASOCIAR_EXISTENTE"
            : "COMPLETAR_DESPUES",
        facturaExistenteId:
          equipment.facturaId ?? "",
        facturaPartida:
          equipment.facturaPartida ?? "",
        importeAdquisicion:
          equipment.importeAdquisicion,
      });

      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [id]);

  const selectedType = useMemo(
    () =>
      catalogs?.tiposEquipo.find(
        (item) =>
          item.id ===
          values.tipoEquipoId,
      )?.codigo,
    [catalogs, values.tipoEquipoId],
  );

  const selectedIncorporation =
    useMemo(
      () =>
        catalogs?.tiposIncorporacion.find(
          (item) =>
            item.id === values.tipoIncorporacionId,
        )?.codigo,
      [catalogs, values.tipoIncorporacionId],
    );

  function set<
    K extends keyof EquipmentFormValues,
  >(
    key: K,
    value: EquipmentFormValues[K],
  ) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function save() {
    if (!asset) return;

    setSaving(true);

    try {
      await updateEquipment(
        asset.id,
        values,
        asset.version,
      );

      pushToast({
        tone: "success",
        title: "Equipo actualizado",
      });

      navigate(
        `/inventory/equipment/${asset.id}`,
        { replace: true },
      );
    } catch (error) {
      pushToast({
        tone: "danger",
        title: "No fue posible guardar",
        description:
          error instanceof Error
            ? error.message
            : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  if (
    loading ||
    !asset ||
    !catalogs
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Spinner className="text-(--accent)" />
      </main>
    );
  }

  const options = (
    list: Array<{
      id: string;
      nombre: string;
      descripcion?: string | null;
      activo?: boolean;
    }>,
  ) =>
    list.map((item) => ({
      value: item.id,
      label:
        item.activo === false
          ? `${item.nombre} · Inactivo (actual)`
          : item.nombre,
      description:
        item.descripcion ??
        undefined,
    }));

  return (
    <main className="min-h-screen px-4 pb-16 pt-8 sm:px-6">
      <div className="mx-auto max-w-[1080px]">
        <button
          type="button"
          onClick={() =>
            navigate(-1)
          }
          className="inline-flex items-center gap-2 text-sm font-medium text-(--text-secondary)"
        >
          <ArrowLeft size={15} />
          Volver
        </button>

        <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-(--text-tertiary)">
              {asset.numeroInventario}
            </div>

            <h1 className="mt-3 text-[clamp(3rem,6vw,5.5rem)] font-semibold leading-[0.92] tracking-[-0.065em]">
              Editar equipo.
            </h1>
          </div>

          <Button
            loading={saving}
            leftIcon={
              <Save size={15} />
            }
            onClick={save}
          >
            Guardar cambios
          </Button>
        </div>

        <div className="mt-9 space-y-4">
          <section className="rounded-[28px] border border-black/[0.055] bg-white/78 p-6 shadow-sm backdrop-blur-xl">
            <h2 className="text-lg font-semibold">
              Identificación
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <ChoiceField
                label="Tipo de equipo"
                value={
                  values.tipoEquipoId
                }
                onChange={(value) =>
                  set(
                    "tipoEquipoId",
                    value,
                  )
                }
                options={options(
                  catalogs.tiposEquipo,
                )}
              />

              <Input
                label="Marca"
                value={values.marca}
                onChange={(event) =>
                  set(
                    "marca",
                    event.target.value,
                  )
                }
              />

              <Input
                label="Modelo"
                value={values.modelo}
                onChange={(event) =>
                  set(
                    "modelo",
                    event.target.value,
                  )
                }
              />

              <Input
                label="Número de serie"
                value={
                  values.numeroSerie
                }
                onChange={(event) =>
                  set(
                    "numeroSerie",
                    event.target.value,
                  )
                }
              />
            </div>
          </section>

          <section className="rounded-[28px] border border-black/[0.055] bg-white/78 p-6 shadow-sm backdrop-blur-xl">
            <h2 className="text-lg font-semibold">
              Técnico
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Input
                label={
                  selectedType ===
                  "TABLET"
                    ? "Nombre del dispositivo"
                    : "Hostname"
                }
                value={values.hostname}
                onChange={(event) =>
                  set(
                    "hostname",
                    event.target.value,
                  )
                }
              />

              <Input
                label="Sistema operativo"
                value={
                  values.sistemaOperativo
                }
                onChange={(event) =>
                  set(
                    "sistemaOperativo",
                    event.target.value,
                  )
                }
              />

              {selectedType !==
                "TABLET" && (
                <>
                  <Input
                    label="Dirección IP"
                    value={
                      values.direccionIp
                    }
                    onChange={(
                      event,
                    ) =>
                      set(
                        "direccionIp",
                        event.target.value,
                      )
                    }
                  />

                  <Input
                    label="AnyDesk"
                    value={
                      values.anydesk
                    }
                    onChange={(
                      event,
                    ) =>
                      set(
                        "anydesk",
                        event.target.value,
                      )
                    }
                  />
                </>
              )}
            </div>
          </section>

          <section className="rounded-[28px] border border-black/[0.055] bg-white/78 p-6 shadow-sm backdrop-blur-xl">
            <h2 className="text-lg font-semibold">
              Asignación
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <ChoiceField
                label="Sucursal"
                value={
                  values.sucursalId
                }
                onChange={(value) =>
                  set(
                    "sucursalId",
                    value,
                  )
                }
                searchable
                options={options(
                  catalogs.sucursales,
                )}
              />

              <ChoiceField
                label="Departamento"
                value={
                  values.departamentoId
                }
                onChange={(value) =>
                  set(
                    "departamentoId",
                    value,
                  )
                }
                options={options(
                  catalogs.departamentos,
                )}
              />

              <Input
                label="Responsable"
                value={
                  values.responsable
                }
                onChange={(event) =>
                  set(
                    "responsable",
                    event.target.value,
                  )
                }
              />

              <Input
                label="Ubicación exacta"
                value={
                  values.ubicacionExacta
                }
                onChange={(event) =>
                  set(
                    "ubicacionExacta",
                    event.target.value,
                  )
                }
              />
            </div>
          </section>

          <section className="rounded-[28px] border border-black/[0.055] bg-white/78 p-6 shadow-sm backdrop-blur-xl">
            <h2 className="text-lg font-semibold">
              Estado
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <ChoiceField
                label="Funcionamiento"
                value={
                  values.estadoFuncionamientoId
                }
                onChange={(value) =>
                  set(
                    "estadoFuncionamientoId",
                    value,
                  )
                }
                options={options(
                  catalogs.estadosFuncionamiento,
                )}
              />

              <ChoiceField
                label="Condición física"
                value={
                  values.condicionFisicaId
                }
                onChange={(value) =>
                  set(
                    "condicionFisicaId",
                    value,
                  )
                }
                options={options(
                  catalogs.condicionesFisicas,
                )}
              />

              <div className="md:col-span-2">
                <TextArea
                  label="Observaciones"
                  value={
                    values.observaciones
                  }
                  onChange={(event) =>
                    set(
                      "observaciones",
                      event.target.value,
                    )
                  }
                />
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-black/[0.055] bg-white/78 p-6 shadow-sm backdrop-blur-xl">
            <h2 className="text-lg font-semibold">
              Adquisición
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <ChoiceField
                label="Tipo de incorporación"
                value={
                  values.tipoIncorporacionId
                }
                onChange={(value) =>
                  set(
                    "tipoIncorporacionId",
                    value,
                  )
                }
                options={options(
                  catalogs.tiposIncorporacion,
                )}
              />

              {(selectedIncorporation === "COMPRA_NUEVA" ||
                Boolean(asset.facturaId)) && (
                <EquipmentInvoiceEditor
                  values={values}
                  catalogs={catalogs}
                  hadInvoice={Boolean(asset.facturaId)}
                  onChange={setValues}
                />
              )}

              <Input
                label="Partida de factura"
                value={
                  values.facturaPartida
                }
                onChange={(event) =>
                  set(
                    "facturaPartida",
                    event.target.value,
                  )
                }
              />

              <Input
                label="Importe de adquisición"
                type="number"
                value={
                  values.importeAdquisicion ??
                  ""
                }
                onChange={(event) =>
                  set(
                    "importeAdquisicion",
                    event.target.value
                      ? Number(
                          event.target.value,
                        )
                      : null,
                  )
                }
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
