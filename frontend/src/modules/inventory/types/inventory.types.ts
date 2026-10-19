export interface InventoryBranch {
  id: string;
  codigo: string;
  nombre: string;
  activa?: boolean;
}

export interface EquipmentHistoryItem {
  id: string;
  evento: string;
  detalle: string | null;
  versionAnterior: number | null;
  versionNueva: number | null;
  creadoEn: string;
  usuarioId: string | null;
  usuarioNombre: string | null;
  usuarioApellidoPaterno: string | null;
}

export interface InventoryAsset {
  id: string;
  numeroInventario: string;
  marca: string;
  modelo: string | null;
  numeroSerie: string;
  hostname: string | null;
  direccionIp: string | null;
  sistemaOperativo: string | null;
  anydesk: string | null;
  responsable: string | null;
  ubicacionExacta: string;
  observaciones: string | null;
  activo: boolean;
  version: number;
  facturaPartida: string | null;
  importeAdquisicion: number | null;
  creadoPor: string;
  creadoEn: string;
  actualizadoEn: string;
  bajaEn: string | null;
  detalleBaja: string | null;
  motivoBajaId: string | null;
  motivoBajaCodigo: string | null;
  motivoBajaNombre: string | null;
  tipoEquipoId: string;
  tipoCodigo: string;
  tipoNombre: string;
  sucursalId: string;
  sucursalCodigo: string;
  sucursalNombre: string;
  departamentoId: string;
  departamentoCodigo: string;
  departamentoNombre: string;
  estadoId: string;
  estadoCodigo: string;
  estadoNombre: string;
  condicionId: string;
  condicionCodigo: string;
  condicionNombre: string;
  incorporacionId: string;
  incorporacionCodigo: string;
  incorporacionNombre: string;
  facturaId: string | null;
  facturaNumero: string | null;
  facturaFecha: string | null;
  facturaProveedor: string | null;
  facturaRazonSocial: string | null;
  facturaMoneda: string | null;
  facturaTotal: number | null;
  history?: EquipmentHistoryItem[];
}

export type AttentionKey =
  | "no_operativo"
  | "observaciones"
  | "sin_responsable"
  | "factura_pendiente"
  | "dano_fisico";

export interface DistributionItem {
  id: string;
  codigo: string;
  nombre: string;
  value: number;
}

export interface InventoryOverview {
  scope: {
    requestedBranchId: string | null;
    allBranches: boolean;
    hasAssignments: boolean;
  };
  branches: InventoryBranch[];
  totals: {
    total: number;
    activos: number;
    inactivos: number;
    operativos: number;
    observaciones: number;
    noOperativos: number;
    sinResponsable: number;
    facturaPendiente: number;
    danoFisico: number;
    requierenAtencion: number;
  };
  statusDistribution: Array<{
    codigo: string;
    nombre: string;
    value: number;
  }>;
  attention: Array<{
    key: AttentionKey;
    label: string;
    count: number;
    tone: "danger" | "warning" | "neutral";
  }>;
  distribution: {
    byType: DistributionItem[];
    byBranch: DistributionItem[];
    byDepartment: DistributionItem[];
  };
  recentAssets: InventoryAsset[];
  recentActivity: Array<{
    id: string;
    type: string;
    equipmentId: string;
    title: string;
    detail: string;
    branch: string;
    occurredAt: string;
  }>;
}

export interface InventoryListResponse {
  items: InventoryAsset[];
  total: number;
  limit: number;
  offset: number;
}

export interface InventoryFilters {
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
