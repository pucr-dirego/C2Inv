export type ManagedRole =
  | "SUPERADMIN"
  | "GERENTE"
  | "USUARIO";

export interface AdminCatalogItem {
  id: string;
  codigo: string;
  nombre: string;
}

export interface AdminUser {
  id: string;
  nombre: string;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
  correo: string;
  estado: string;
  creadoEn: string;
  aprobadoEn: string | null;
  bloqueadoEn: string | null;
  ultimoLoginEn: string | null;
  roles: AdminCatalogItem[];
  sucursales: AdminCatalogItem[];
}

export interface AdminCatalogs {
  sucursales: AdminCatalogItem[];
  roles: AdminCatalogItem[];
}
