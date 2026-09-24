export type ManagedRole =
  | "SUPERADMIN"
  | "GERENTE"
  | "USUARIO";

export interface AdminAuthUser {
  id: string;
  roles: string[];
}
