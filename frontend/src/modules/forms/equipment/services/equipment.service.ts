import type {
  CreatedEquipment,
  EquipmentCatalogs,
  EquipmentFormValues,
} from "../types/equipment.types";

const API_BASE =
  import.meta.env.VITE_API_URL?.replace(
    /\/$/,
    "",
  ) ?? "http://localhost:3002";

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
        ...(options.headers ?? {}),
      },
    },
  );

  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    const error = new Error(
      data?.message ??
        "Ocurrió un error inesperado.",
    ) as Error & {
      code?: string;
      status?: number;
    };

    error.code = data?.code;
    error.status = response.status;

    throw error;
  }

  return data as T;
}

function payload(
  values: EquipmentFormValues,
) {
  return {
    ...values,
    factura: {
      ...values.factura,
      numeroFactura:
        values.factura.numeroFactura ||
        undefined,
      fechaFactura:
        values.factura.fechaFactura ||
        undefined,
      proveedorNombre:
        values.factura.proveedorNombre ||
        undefined,
      razonSocial:
        values.factura.razonSocial ||
        undefined,
      moneda:
        values.factura.moneda ||
        "MXN",
      total:
        values.factura.total == null
          ? undefined
          : Number(
              values.factura.total,
            ),
      observaciones:
        values.factura.observaciones ||
        undefined,
    },
    facturaExistenteId:
      values.facturaExistenteId ||
      undefined,
    facturaPartida:
      values.facturaPartida ||
      undefined,
    importeAdquisicion:
      values.importeAdquisicion == null
        ? undefined
        : Number(
            values.importeAdquisicion,
          ),
  };
}

export async function getEquipmentCatalogs() {
  const response = await request<{
    ok: true;
    catalogs: EquipmentCatalogs;
  }>("/api/catalogos/equipos");

  return response.catalogs;
}

export async function createEquipment(
  values: EquipmentFormValues,
): Promise<CreatedEquipment> {
  const response = await request<{
    ok: true;
    equipment: CreatedEquipment;
  }>("/api/equipos", {
    method: "POST",
    body: JSON.stringify(
      payload(values),
    ),
  });

  return response.equipment;
}

export async function updateEquipment(
  id: string,
  values: EquipmentFormValues,
  version: number,
) {
  const response = await request<{
    ok: true;
    equipment: {
      id: string;
      version: number;
      actualizadoEn: string;
    };
  }>(
    `/api/equipos/${encodeURIComponent(
      id,
    )}`,
    {
      method: "PUT",
      body: JSON.stringify({
        ...payload(values),
        version,
      }),
    },
  );

  return response.equipment;
}

export async function getDeactivationReasons() {
  const response = await request<{
    ok: true;
    items: Array<{
      id: string;
      codigo: string;
      nombre: string;
      descripcion: string | null;
    }>;
  }>("/api/equipos/motivos-baja");

  return response.items;
}

export async function deactivateEquipment(
  id: string,
  input: {
    motivoBajaId: string;
    detalle?: string;
    version: number;
  },
) {
  return request(
    `/api/equipos/${encodeURIComponent(
      id,
    )}/baja`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export async function reactivateEquipment(
  id: string,
  version: number,
) {
  return request(
    `/api/equipos/${encodeURIComponent(
      id,
    )}/reactivar`,
    {
      method: "POST",
      body: JSON.stringify({
        version,
      }),
    },
  );
}
