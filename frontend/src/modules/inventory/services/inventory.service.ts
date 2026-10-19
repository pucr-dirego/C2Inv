import type {
  InventoryAsset,
  InventoryFilters,
  InventoryListResponse,
  InventoryOverview,
} from "../types/inventory.types";

const API_BASE =
  import.meta.env.VITE_API_URL?.replace(
    /\/$/,
    "",
  ) ?? "http://localhost:3002";

async function request<T>(
  path: string,
): Promise<T> {
  const response = await fetch(
    `${API_BASE}${path}`,
    {
      credentials: "include",
    },
  );

  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ??
        "No fue posible consultar el inventario.",
    );
  }

  return data as T;
}

function queryString(
  values: object,
) {
  const params = new URLSearchParams();

  Object.entries(values).forEach(
    ([key, value]) => {
      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        return;
      }

      params.set(
        key,
        String(value),
      );
    },
  );

  const query = params.toString();

  return query
    ? `?${query}`
    : "";
}

export async function getInventoryOverview(
  branchId?: string,
) {
  const response = await request<{
    ok: true;
    data: InventoryOverview;
  }>(
    `/api/inventory/overview${queryString({
      branchId,
    })}`,
  );

  return response.data;
}

export async function listInventory(
  filters: InventoryFilters = {},
) {
  const response = await request<{
    ok: true;
    data: InventoryListResponse;
  }>(
    `/api/inventory/equipment${queryString(
      filters,
    )}`,
  );

  return response.data;
}

export async function listMyEquipment() {
  const response = await request<{
    ok: true;
    items: InventoryAsset[];
  }>("/api/inventory/mine");

  return response.items;
}

export async function getInventoryEquipment(
  id: string,
) {
  const response = await request<{
    ok: true;
    equipment: InventoryAsset;
  }>(
    `/api/inventory/equipment/${encodeURIComponent(
      id,
    )}`,
  );

  return response.equipment;
}
