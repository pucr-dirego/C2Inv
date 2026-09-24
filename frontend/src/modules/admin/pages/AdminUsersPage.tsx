import {
  Building2,
  LockKeyhole,
  PencilLine,
  RefreshCcw,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Button } from "../../../components/ui/Button";
import { ChoiceField } from "../../../components/ui/ChoiceField";
import { Sheet } from "../../../components/ui/Sheet";
import { Spinner } from "../../../components/ui/Spinner";
import { TextArea } from "../../../components/ui/TextArea";
import { useToast } from "../../../components/ui/ToastProvider";
import { useAutoRefresh } from "../../../hooks/useAutoRefresh";
import { InventoryShell } from "../../inventory/components/InventoryShell";
import {
  approveUser,
  blockUser,
  getAdminCatalogs,
  getAdminUsers,
  revokeUserSessions,
  unblockUser,
  updateUserAccess,
} from "../services/admin.service";
import type {
  AdminCatalogs,
  AdminUser,
  ManagedRole,
} from "../types/admin.types";

export function AdminUsersPage() {
  const { pushToast } =
    useToast();

  const [users, setUsers] =
    useState<AdminUser[]>([]);

  const [catalogs, setCatalogs] =
    useState<AdminCatalogs | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [selected, setSelected] =
    useState<AdminUser | null>(
      null,
    );

  const [role, setRole] =
    useState<ManagedRole>(
      "USUARIO",
    );

  const [branchId, setBranchId] =
    useState("");

  const [
    filterBranchId,
    setFilterBranchId,
  ] = useState("");

  const [
    blockReason,
    setBlockReason,
  ] = useState("");

  const load = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
      }

      try {
        const [
          userData,
          catalogData,
        ] = await Promise.all([
          getAdminUsers(),
          getAdminCatalogs(),
        ]);

        setUsers(userData);
        setCatalogs(catalogData);
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useAutoRefresh(
    () => load(true),
    {
      intervalMs: 30_000,
    },
  );

  const visibleUsers =
    useMemo(() => {
      if (!filterBranchId) {
        return users;
      }

      return users.filter(
        (user) =>
          user.sucursales.some(
            (branch) =>
              branch.id ===
              filterBranchId,
          ),
      );
    }, [
      users,
      filterBranchId,
    ]);

  const pending = useMemo(
    () =>
      visibleUsers.filter(
        (user) =>
          user.estado ===
          "PENDIENTE",
      ),
    [visibleUsers],
  );

  const branchLocked =
    selected?.estado ===
      "PENDIENTE" &&
    selected.sucursales.length > 0;

  function open(user: AdminUser) {
    setSelected(user);

    setRole(
      (user.roles[0]
        ?.codigo as ManagedRole) ??
        "USUARIO",
    );

    setBranchId(
      user.sucursales[0]?.id ??
        "",
    );

    setBlockReason("");
  }

  async function saveAccess() {
    if (!selected) {
      return;
    }

    const branchIds =
      branchId
        ? [branchId]
        : [];

    if (
      role !== "SUPERADMIN" &&
      !branchId
    ) {
      pushToast({
        tone: "warning",
        title:
          "Selecciona una sucursal",
      });

      return;
    }

    const action =
      selected.estado ===
      "PENDIENTE"
        ? approveUser
        : updateUserAccess;

    await action(
      selected.id,
      {
        role,
        branchIds,
      },
    );

    pushToast({
      tone: "success",
      title:
        selected.estado ===
        "PENDIENTE"
          ? "Usuario aprobado"
          : "Acceso actualizado",
    });

    setSelected(null);
    await load(true);
  }

  async function toggleBlock() {
    if (!selected) {
      return;
    }

    if (
      selected.estado ===
      "BLOQUEADO"
    ) {
      await unblockUser(
        selected.id,
      );

      pushToast({
        tone: "success",
        title:
          "Usuario desbloqueado",
      });
    } else {
      if (
        blockReason.trim().length <
        3
      ) {
        pushToast({
          tone: "warning",
          title:
            "Indica el motivo del bloqueo",
        });

        return;
      }

      await blockUser(
        selected.id,
        blockReason,
      );

      pushToast({
        tone: "success",
        title:
          "Usuario bloqueado",
      });
    }

    setSelected(null);
    await load(true);
  }

  return (
    <InventoryShell>
      <main className="mx-auto max-w-[1280px] px-4 pb-16 sm:px-6">
        <section className="pt-10">
          <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-(--text-tertiary)">
            Administración
          </div>

          <h1 className="mt-3 text-[clamp(3.4rem,6.4vw,6rem)] font-semibold leading-[0.92] tracking-[-0.07em]">
            Personas y acceso.
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-(--text-secondary)">
            Aprueba cuentas, define su rol y limita el alcance operativo a las sucursales correspondientes.
          </p>
        </section>

        <section className="mt-8 flex flex-col gap-3 rounded-[24px] border border-black/[0.055] bg-white/58 p-4 shadow-sm backdrop-blur-2xl sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full sm:max-w-[310px]">
            <ChoiceField
              label="Filtrar por sucursal"
              value={
                filterBranchId
              }
              onChange={
                setFilterBranchId
              }
              searchable
              placeholder="Todas las sucursales"
              options={[
                {
                  value: "",
                  label:
                    "Todas las sucursales",
                  description:
                    "Vista global de usuarios",
                },
                ...(catalogs
                  ?.sucursales ??
                  []).map(
                  (branch) => ({
                    value:
                      branch.id,
                    label:
                      branch.nombre,
                    description:
                      branch.codigo,
                  }),
                ),
              ]}
            />
          </div>

          <div className="flex items-center gap-2 pb-1 text-xs text-(--text-tertiary)">
            <Building2
              size={14}
              strokeWidth={1.7}
            />

            <span>
              {visibleUsers.length}{" "}
              {visibleUsers.length ===
              1
                ? "usuario"
                : "usuarios"}
            </span>
          </div>
        </section>

        {pending.length > 0 && (
          <section className="mt-6 rounded-[28px] bg-black p-6 text-white shadow-[0_28px_80px_rgba(0,0,0,.16)]">
            <div className="flex items-center gap-3">
              <UserCheck
                size={19}
              />

              <h2 className="text-xl font-semibold">
                Solicitudes pendientes
              </h2>
            </div>

            <div className="mt-5 grid gap-2">
              {pending.map(
                (user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() =>
                      open(user)
                    }
                    className="group flex items-center justify-between rounded-[17px] bg-white/[0.065] px-4 py-3 text-left transition hover:bg-white/[0.095]"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">
                        {user.nombre}{" "}
                        {user.apellidoPaterno}
                      </div>

                      <div className="mt-1 truncate text-xs text-white/45">
                        {user.correo}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-blue-300">
                      Revisar
                      <PencilLine
                        size={14}
                        strokeWidth={1.8}
                      />
                    </div>
                  </button>
                ),
              )}
            </div>
          </section>
        )}

        <section className="mt-6 overflow-hidden rounded-[28px] border border-black/[0.055] bg-white/72 shadow-sm backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4 border-b border-black/[0.055] p-5">
            <div>
              <h2 className="text-lg font-semibold">
                Usuarios
              </h2>

              <p className="mt-1 text-[11px] text-(--text-tertiary)">
                Selecciona una persona para revisar o editar su acceso.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-48 items-center justify-center">
              <Spinner className="text-(--accent)" />
            </div>
          ) : visibleUsers.length ===
            0 ? (
            <div className="p-10 text-center text-sm text-(--text-secondary)">
              No hay usuarios asociados a la sucursal seleccionada.
            </div>
          ) : (
            visibleUsers.map(
              (user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() =>
                    open(user)
                  }
                  className="group grid w-full grid-cols-[1fr_auto] items-center gap-4 border-b border-black/[0.055] p-5 text-left outline-none transition last:border-0 hover:bg-black/[0.025] focus-visible:bg-blue-500/[0.055] sm:grid-cols-[1.3fr_.7fr_.7fr_auto_auto]"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">
                      {user.nombre}{" "}
                      {user.apellidoPaterno}
                    </div>

                    <div className="mt-1 truncate text-xs text-(--text-secondary)">
                      {user.correo}
                    </div>
                  </div>

                  <div className="hidden text-xs sm:block">
                    {user.roles[0]
                      ?.nombre ??
                      "Sin rol"}
                  </div>

                  <div className="hidden text-xs text-(--text-secondary) sm:block">
                    {user.sucursales
                      .map(
                        (item) =>
                          item.nombre,
                      )
                      .join(", ") ||
                      "Sin sucursal"}
                  </div>

                  <div className="text-xs font-semibold">
                    {user.estado}
                  </div>

                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.035] text-black/25 transition group-hover:bg-black/[0.06] group-hover:text-(--text-secondary)">
                    <PencilLine
                      size={14}
                      strokeWidth={1.8}
                    />
                  </span>
                </button>
              ),
            )
          )}
        </section>

        <Sheet
          open={Boolean(selected)}
          onClose={() =>
            setSelected(null)
          }
          title="Acceso de usuario"
        >
          {selected &&
            catalogs && (
              <div className="space-y-6">
                <div>
                  <div className="text-lg font-semibold">
                    {selected.nombre}{" "}
                    {selected.apellidoPaterno}
                  </div>

                  <div className="mt-1 text-sm text-(--text-secondary)">
                    {selected.correo}
                  </div>
                </div>

                <ChoiceField
                  label="Rol"
                  value={role}
                  onChange={(
                    value,
                  ) =>
                    setRole(
                      value as ManagedRole,
                    )
                  }
                  options={catalogs.roles.map(
                    (item) => ({
                      value:
                        item.codigo,
                      label:
                        item.nombre,
                    }),
                  )}
                />

                <ChoiceField
                  label={
                    branchLocked
                      ? "Sucursal registrada"
                      : "Sucursal"
                  }
                  value={branchId}
                  onChange={
                    setBranchId
                  }
                  placeholder={
                    role ===
                    "SUPERADMIN"
                      ? "Sucursal de referencia"
                      : "Selecciona una sucursal"
                  }
                  searchable={
                    !branchLocked
                  }
                  disabled={
                    branchLocked
                  }
                  hint={
                    branchLocked
                      ? "La persona seleccionó esta sucursal al crear su cuenta."
                      : undefined
                  }
                  options={catalogs.sucursales.map(
                    (item) => ({
                      value:
                        item.id,
                      label:
                        item.nombre,
                      description:
                        item.codigo,
                    }),
                  )}
                />

                <Button
                  className="w-full"
                  leftIcon={
                    <ShieldCheck
                      size={15}
                    />
                  }
                  onClick={
                    saveAccess
                  }
                >
                  {selected.estado ===
                  "PENDIENTE"
                    ? "Aprobar acceso"
                    : "Guardar acceso"}
                </Button>

                {selected.estado !==
                  "PENDIENTE" && (
                  <>
                    <Button
                      variant="secondary"
                      className="w-full"
                      leftIcon={
                        <RefreshCcw
                          size={
                            15
                          }
                        />
                      }
                      onClick={async () => {
                        await revokeUserSessions(
                          selected.id,
                        );

                        pushToast({
                          tone:
                            "success",
                          title:
                            "Sesiones revocadas",
                        });
                      }}
                    >
                      Cerrar sesiones activas
                    </Button>

                    {selected.estado !==
                      "BLOQUEADO" && (
                      <TextArea
                        label="Motivo de bloqueo"
                        value={
                          blockReason
                        }
                        onChange={(
                          event,
                        ) =>
                          setBlockReason(
                            event
                              .target
                              .value,
                          )
                        }
                      />
                    )}

                    <Button
                      variant={
                        selected.estado ===
                        "BLOQUEADO"
                          ? "secondary"
                          : "danger"
                      }
                      className="w-full"
                      leftIcon={
                        <LockKeyhole
                          size={
                            15
                          }
                        />
                      }
                      onClick={
                        toggleBlock
                      }
                    >
                      {selected.estado ===
                      "BLOQUEADO"
                        ? "Desbloquear usuario"
                        : "Bloquear usuario"}
                    </Button>
                  </>
                )}
              </div>
            )}
        </Sheet>
      </main>
    </InventoryShell>
  );
}
