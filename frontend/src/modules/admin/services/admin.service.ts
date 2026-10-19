import type {
  AdminBranch,
  AdminCatalogs,
  AdminUser,
  ManagedRole,
} from "../types/admin.types";

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
    throw new Error(
      data?.message ??
        "No fue posible completar la operación.",
    );
  }

  return data as T;
}

export async function getAdminUsers() {
  const response = await request<{
    ok: true;
    users: AdminUser[];
  }>("/api/admin/users");

  return response.users;
}

export async function getAdminCatalogs() {
  const response = await request<{
    ok: true;
    catalogs: AdminCatalogs;
  }>("/api/admin/catalogs");

  return response.catalogs;
}

export async function approveUser(
  id: string,
  input: {
    role: ManagedRole;
    branchIds: string[];
  },
) {
  return request(
    `/api/admin/users/${id}/approve`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export async function updateUserAccess(
  id: string,
  input: {
    role: ManagedRole;
    branchIds: string[];
  },
) {
  return request(
    `/api/admin/users/${id}/access`,
    {
      method: "PUT",
      body: JSON.stringify(input),
    },
  );
}

export async function blockUser(
  id: string,
  reason: string,
) {
  return request(
    `/api/admin/users/${id}/block`,
    {
      method: "POST",
      body: JSON.stringify({
        reason,
      }),
    },
  );
}

export async function unblockUser(
  id: string,
) {
  return request(
    `/api/admin/users/${id}/unblock`,
    {
      method: "POST",
    },
  );
}

export async function revokeUserSessions(
  id: string,
) {
  return request(
    `/api/admin/users/${id}/revoke-sessions`,
    {
      method: "POST",
    },
  );
}


export async function getAdminBranches() {
  const response = await request<{
    ok: true;
    branches: AdminBranch[];
  }>("/api/admin/branches");

  return response.branches;
}

export async function updateAdminBranchStatus(
  id: string,
  active: boolean,
) {
  return request<{
    ok: true;
    branch: {
      id: string;
      codigo: string;
      nombre: string;
      activa: boolean;
    };
  }>(
    `/api/admin/branches/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ active }),
    },
  );
}
