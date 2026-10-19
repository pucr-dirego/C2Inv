export interface RegisterInput {
  nombre: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  correo: string;
  password: string;
  sucursalId: string;
}

export interface RegisterResult {
  id: string;
  nombre: string;
  correo: string;
  estado: "PENDIENTE";
  sucursal: AuthBranch;
}

export interface LoginInput {
  correo: string;
  password: string;
}

export interface AuthBranch {
  id: string;
  codigo: string;
  nombre: string;
  activa: boolean;
}

export interface AuthenticatedUser {
  id: string;
  nombre: string;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
  correo: string;
  estado: "ACTIVO";
  roles: string[];
  sucursales: AuthBranch[];
}

export interface LoginResult {
  token: string;
  expiresAt: Date;
  user: AuthenticatedUser;
}
