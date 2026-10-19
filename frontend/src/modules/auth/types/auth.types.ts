export type AppRole =
  | "SUPERADMIN"
  | "GERENTE"
  | "USUARIO";

export interface AuthBranch {
  id: string;
  codigo: string;
  nombre: string;
  activa: boolean;
}

export interface AuthUser {
  id: string;
  nombre: string;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
  correo: string;
  estado: string;
  roles: string[];
  sucursales: AuthBranch[];
}

export interface LoginPayload {
  correo: string;
  password: string;
}

export interface RegisterPayload {
  nombre: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  correo: string;
  password: string;
  sucursalId: string;
}

export interface AuthResponse {
  ok: boolean;
  message?: string;
  user?: AuthUser;
  code?: string;
}
