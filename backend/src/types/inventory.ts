export type AttentionKey =
  | "no_operativo"
  | "observaciones"
  | "sin_responsable"
  | "factura_pendiente"
  | "dano_fisico";

export interface InventoryAuthUser {
  id: string;
  roles: string[];
  sucursales: Array<{
    id: string;
    codigo: string;
    nombre: string;
  }>;
}

export interface InventoryQuery {
  search?: string;
  branchId?: string;
  typeCode?: string;
  departmentId?: string;
  statusCode?: string;
  attention?: AttentionKey;
  active?: "active" | "inactive" | "all";
  limit?: number;
  offset?: number;
}
