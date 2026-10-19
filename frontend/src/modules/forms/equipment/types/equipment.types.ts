export interface CatalogItem {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  activo?: boolean;
}

export interface PurchaseInvoiceCatalogItem {
  id: string;
  numeroFactura: string | null;
  fechaFactura: string | null;
  proveedorNombre: string | null;
  razonSocial: string | null;
  moneda: string;
  total: number | null;
}

export interface EquipmentCatalogs {
  sucursales: CatalogItem[];
  departamentos: CatalogItem[];
  tiposEquipo: CatalogItem[];
  estadosFuncionamiento: CatalogItem[];
  condicionesFisicas: CatalogItem[];
  tiposIncorporacion: CatalogItem[];
  facturasCompra: PurchaseInvoiceCatalogItem[];
}

export type InvoiceCaptureMode =
  | "REGISTRAR_AHORA"
  | "ASOCIAR_EXISTENTE"
  | "COMPLETAR_DESPUES";

export interface EquipmentInvoiceForm {
  numeroFactura?: string;
  fechaFactura?: string;
  proveedorNombre?: string;
  razonSocial?: string;
  moneda?: string;
  total?: number | null;
  observaciones?: string;
}

export interface EquipmentFormValues {
  tipoEquipoId: string;
  marca: string;
  modelo: string;
  numeroSerie: string;

  hostname: string;
  direccionIp: string;
  sistemaOperativo: string;
  anydesk: string;

  estadoFuncionamientoId: string;
  condicionFisicaId: string;
  observaciones: string;

  sucursalId: string;
  departamentoId: string;
  responsable: string;
  ubicacionExacta: string;

  tipoIncorporacionId: string;

  facturaModo: InvoiceCaptureMode;
  facturaExistenteId: string;
  facturaPartida: string;
  importeAdquisicion: number | null;

  factura: EquipmentInvoiceForm;
}

export interface CreatedEquipment {
  id: string;
  numeroInventario: string;
  numeroSerie: string;
  creadoEn: string;
}
