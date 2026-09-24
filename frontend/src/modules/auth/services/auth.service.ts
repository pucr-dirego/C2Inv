import type {
  AuthBranch,
  AuthResponse,
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from "../types/auth.types";

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

export const login = (
  payload: LoginPayload,
) =>
  request<AuthResponse>(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

export const register = (
  payload: RegisterPayload,
) =>
  request<AuthResponse>(
    "/api/auth/register",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

export async function getRegistrationBranches() {
  const response = await request<{
    ok: true;
    branches: AuthBranch[];
  }>("/api/auth/branches");

  return response.branches;
}

export const getCurrentUser = () =>
  request<{
    ok: true;
    user: AuthUser;
  }>("/api/auth/me");

export const logout = () =>
  request<AuthResponse>(
    "/api/auth/logout",
    {
      method: "POST",
    },
  );
