
import type { PoolClient } from "pg";

import { pool } from "../db/pool.js";
import type {
  AdminAuthUser,
  ManagedRole,
} from "../types/admin.js";

export class AdminServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AdminServiceError";
  }
}

type Queryable = {
  query: (
    text: string,
    values?: unknown[],
  ) => Promise<any>;
};


type UserState =
  | "PENDIENTE"
  | "ACTIVO"
  | "BLOQUEADO";

type StateAction =
  | "APPROVE"
  | "BLOCK"
  | "UNBLOCK";

async function lockUserState(
  client: PoolClient,
  userId: string,
): Promise<UserState> {
  const result = await client.query<{
    estado: UserState;
  }>(
    `
      SELECT estado
      FROM usuarios
      WHERE id = $1
      FOR UPDATE
    `,
    [userId],
  );

  const state = result.rows[0]?.estado;

  if (!state) {
    throw new AdminServiceError(
      "NOT_FOUND",
      "El usuario no existe.",
    );
  }

  return state;
}

function assertStateTransition(
  currentState: UserState,
  action: StateAction,
) {
  const expectedState: Record<
    StateAction,
    UserState
  > = {
    APPROVE: "PENDIENTE",
    BLOCK: "ACTIVO",
    UNBLOCK: "BLOQUEADO",
  };

  const labels: Record<
    StateAction,
    string
  > = {
    APPROVE: "aprobar",
    BLOCK: "bloquear",
    UNBLOCK: "desbloquear",
  };

  if (
    currentState !==
    expectedState[action]
  ) {
    throw new AdminServiceError(
      "INVALID_USER_STATE_TRANSITION",
      `No puedes ${labels[action]} un usuario en estado ${currentState}.`,
    );
  }
}

async function withTransaction<T>(
  work: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const value = await work(client);
    await client.query("COMMIT");
    return value;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function audit(
  db: Queryable,
  actorId: string,
  targetId: string | null,
  action: string,
  before: unknown,
  after: unknown,
  detail?: string,
  ip?: string,
) {
  await db.query(
    `
      INSERT INTO auditoria_administracion (
        actor_id,
        usuario_objetivo_id,
        accion,
        datos_anteriores,
        datos_nuevos,
        detalle,
        ip
      )
      VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6,$7)
    `,
    [
      actorId,
      targetId,
      action,
      before == null
        ? null
        : JSON.stringify(before),
      after == null
        ? null
        : JSON.stringify(after),
      detail ?? null,
      ip ?? null,
    ],
  );
}

async function userSnapshot(
  db: Queryable,
  userId: string,
) {
  const result = await db.query(
    `
      SELECT
        u.id,
        u.nombre,
        u.apellido_paterno AS "apellidoPaterno",
        u.apellido_materno AS "apellidoMaterno",
        u.correo,
        u.estado,
        u.creado_en AS "creadoEn",
        u.aprobado_en AS "aprobadoEn",
        u.bloqueado_en AS "bloqueadoEn",
        u.ultimo_login_en AS "ultimoLoginEn",

        COALESCE(
          JSONB_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'id', r.id,
              'codigo', r.codigo,
              'nombre', r.nombre
            )
          ) FILTER (WHERE r.id IS NOT NULL),
          '[]'::jsonb
        ) AS roles,

        COALESCE(
          JSONB_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'id', s.id,
              'codigo', s.codigo,
              'nombre', s.nombre,
              'activa', s.activa
            )
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'::jsonb
        ) AS sucursales

      FROM usuarios u
      LEFT JOIN usuarios_roles ur
        ON ur.usuario_id = u.id
      LEFT JOIN roles r
        ON r.id = ur.rol_id
        AND r.activo = TRUE
      LEFT JOIN usuarios_sucursales us
        ON us.usuario_id = u.id
      LEFT JOIN sucursales s
        ON s.id = us.sucursal_id
      WHERE u.id = $1
      GROUP BY u.id
    `,
    [userId],
  );

  return result.rows[0] ?? null;
}

export async function listAdminUsers() {
  const result = await pool.query(
    `
      SELECT
        u.id,
        u.nombre,
        u.apellido_paterno AS "apellidoPaterno",
        u.apellido_materno AS "apellidoMaterno",
        u.correo,
        u.estado,
        u.creado_en AS "creadoEn",
        u.aprobado_en AS "aprobadoEn",
        u.bloqueado_en AS "bloqueadoEn",
        u.ultimo_login_en AS "ultimoLoginEn",

        COALESCE(
          JSONB_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'id', r.id,
              'codigo', r.codigo,
              'nombre', r.nombre
            )
          ) FILTER (WHERE r.id IS NOT NULL),
          '[]'::jsonb
        ) AS roles,

        COALESCE(
          JSONB_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'id', s.id,
              'codigo', s.codigo,
              'nombre', s.nombre,
              'activa', s.activa
            )
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'::jsonb
        ) AS sucursales

      FROM usuarios u
      LEFT JOIN usuarios_roles ur
        ON ur.usuario_id = u.id
      LEFT JOIN roles r
        ON r.id = ur.rol_id
        AND r.activo = TRUE
      LEFT JOIN usuarios_sucursales us
        ON us.usuario_id = u.id
      LEFT JOIN sucursales s
        ON s.id = us.sucursal_id
      GROUP BY u.id
      ORDER BY
        CASE u.estado
          WHEN 'PENDIENTE' THEN 1
          WHEN 'ACTIVO' THEN 2
          WHEN 'BLOQUEADO' THEN 3
          ELSE 4
        END,
        u.creado_en DESC
    `,
  );

  return result.rows;
}

export async function getAdminCatalogs() {
  const [branches, roles] = await Promise.all([
    pool.query(`
      SELECT id, codigo, nombre, activa
      FROM sucursales
      ORDER BY activa DESC, nombre
    `),
    pool.query(`
      SELECT id, codigo, nombre
      FROM roles
      WHERE activo = TRUE
        AND codigo IN ('SUPERADMIN','GERENTE','USUARIO')
      ORDER BY
        CASE codigo
          WHEN 'SUPERADMIN' THEN 1
          WHEN 'GERENTE' THEN 2
          WHEN 'USUARIO' THEN 3
          ELSE 99
        END
    `),
  ]);

  return {
    sucursales: branches.rows,
    roles: roles.rows,
  };
}

export async function listAdminBranches() {
  const result = await pool.query(`
    SELECT
      s.id,
      s.codigo,
      s.nombre,
      s.activa,
      s.creado_en AS "creadoEn",
      s.actualizado_en AS "actualizadoEn",
      su.pais_codigo AS "paisCodigo",
      su.region,
      su.ciudad,

      (
        SELECT COUNT(*)::int
        FROM equipos_ti e
        WHERE e.sucursal_id = s.id
      ) AS "equiposTotal",

      (
        SELECT COUNT(*)::int
        FROM equipos_ti e
        WHERE e.sucursal_id = s.id
          AND e.activo = TRUE
      ) AS "equiposActivos",

      (
        SELECT COUNT(*)::int
        FROM usuarios_sucursales us
        WHERE us.sucursal_id = s.id
      ) AS "usuariosAsignados"

    FROM sucursales s
    LEFT JOIN sucursales_ubicaciones su
      ON su.sucursal_id = s.id
    ORDER BY
      s.activa DESC,
      s.nombre
  `);

  return result.rows;
}

async function validateBranchSelection(
  client: PoolClient,
  targetId: string,
  branchIds: string[],
  allowExistingInactive: boolean,
) {
  const uniqueIds = [
    ...new Set(branchIds),
  ];

  if (uniqueIds.length === 0) {
    return;
  }

  const result = await client.query<{
    id: string;
    activa: boolean;
    assigned: boolean;
  }>(
    `
      SELECT
        s.id,
        s.activa,
        EXISTS (
          SELECT 1
          FROM usuarios_sucursales us
          WHERE us.usuario_id = $2
            AND us.sucursal_id = s.id
        ) AS assigned
      FROM sucursales s
      WHERE s.id = ANY($1::uuid[])
    `,
    [uniqueIds, targetId],
  );

  if (result.rows.length !== uniqueIds.length) {
    throw new AdminServiceError(
      "BRANCH_NOT_FOUND",
      "Una de las sucursales seleccionadas no existe.",
    );
  }

  const invalid = result.rows.find(
    (branch) =>
      !branch.activa &&
      !(
        allowExistingInactive &&
        branch.assigned
      ),
  );

  if (invalid) {
    throw new AdminServiceError(
      "BRANCH_INACTIVE",
      "No puedes asignar una sucursal inactiva a un usuario.",
    );
  }
}

async function lockSuperadminInvariant(
  client: PoolClient,
) {
  // Serializa solamente las operaciones que pueden reducir el número
  // de SUPERADMIN activos. Evita una carrera donde dos administradores
  // se degraden/bloqueen simultáneamente y ambos crean que queda otro.
  await client.query(`
    SELECT pg_advisory_xact_lock(
      hashtextextended(
        'inventarios_ti:last_active_superadmin',
        0
      )
    )
  `);
}

async function assertCanRemoveActiveSuperadmin(
  client: PoolClient,
  targetId: string,
) {
  await lockSuperadminInvariant(client);

  const targetResult = await client.query<{
    is_active_superadmin: boolean;
  }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM usuarios u
        INNER JOIN usuarios_roles ur
          ON ur.usuario_id = u.id
        INNER JOIN roles r
          ON r.id = ur.rol_id
        WHERE u.id = $1
          AND u.estado = 'ACTIVO'
          AND r.activo = TRUE
          AND r.codigo = 'SUPERADMIN'
      ) AS is_active_superadmin
    `,
    [targetId],
  );

  if (
    !targetResult.rows[0]
      ?.is_active_superadmin
  ) {
    return;
  }

  const countResult = await client.query<{
    total: number;
  }>(`
    SELECT COUNT(DISTINCT u.id)::int AS total
    FROM usuarios u
    INNER JOIN usuarios_roles ur
      ON ur.usuario_id = u.id
    INNER JOIN roles r
      ON r.id = ur.rol_id
    WHERE u.estado = 'ACTIVO'
      AND r.activo = TRUE
      AND r.codigo = 'SUPERADMIN'
  `);

  const total =
    countResult.rows[0]?.total ?? 0;

  if (total <= 1) {
    throw new AdminServiceError(
      "LAST_SUPERADMIN",
      "El sistema debe conservar al menos un SUPERADMIN activo.",
    );
  }
}

async function applyAccess(
  client: PoolClient,
  targetId: string,
  input: {
    role: ManagedRole;
    branchIds: string[];
  },
  actor: AdminAuthUser,
  approve: boolean,
) {
  const uniqueBranchIds = [
    ...new Set(input.branchIds),
  ];

  if (
    input.role !== "SUPERADMIN" &&
    uniqueBranchIds.length !== 1
  ) {
    throw new AdminServiceError(
      "BRANCH_CARDINALITY",
      "Los roles GERENTE y USUARIO deben tener exactamente una sucursal.",
    );
  }

  await validateBranchSelection(
    client,
    targetId,
    uniqueBranchIds,
    !approve,
  );

  const roleResult = await client.query<{
    id: string;
  }>(
    `
      SELECT id
      FROM roles
      WHERE codigo = $1
        AND activo = TRUE
      LIMIT 1
    `,
    [input.role],
  );

  const roleId = roleResult.rows[0]?.id;

  if (!roleId) {
    throw new AdminServiceError(
      "INVALID_ROLE",
      "El rol no es válido.",
    );
  }

  if (
    !approve &&
    input.role !== "SUPERADMIN"
  ) {
    await assertCanRemoveActiveSuperadmin(
      client,
      targetId,
    );
  }

  if (approve) {
    await client.query(
      `
        UPDATE usuarios
        SET
          estado = 'ACTIVO',
          aprobado_en = NOW(),
          aprobado_por = $1,
          bloqueado_en = NULL,
          bloqueado_por = NULL,
          motivo_bloqueo = NULL,
          actualizado_en = NOW()
        WHERE id = $2
      `,
      [actor.id, targetId],
    );
  }

  await client.query(
    `DELETE FROM usuarios_roles WHERE usuario_id = $1`,
    [targetId],
  );

  await client.query(
    `
      INSERT INTO usuarios_roles (
        usuario_id,
        rol_id,
        asignado_en,
        asignado_por
      )
      VALUES ($1, $2, NOW(), $3)
    `,
    [targetId, roleId, actor.id],
  );

  await client.query(
    `DELETE FROM usuarios_sucursales WHERE usuario_id = $1`,
    [targetId],
  );

  for (const branchId of uniqueBranchIds) {
    await client.query(
      `
        INSERT INTO usuarios_sucursales (
          usuario_id,
          sucursal_id,
          asignada_en,
          asignada_por
        )
        VALUES ($1, $2, NOW(), $3)
      `,
      [targetId, branchId, actor.id],
    );
  }
}

export async function approveUser(
  targetId: string,
  input: {
    role: ManagedRole;
    branchIds: string[];
  },
  actor: AdminAuthUser,
  ip?: string,
) {
  return withTransaction(async (client) => {
    const currentState =
      await lockUserState(
        client,
        targetId,
      );

    assertStateTransition(
      currentState,
      "APPROVE",
    );

    const before = await userSnapshot(
      client,
      targetId,
    );

    await applyAccess(
      client,
      targetId,
      input,
      actor,
      true,
    );

    const after = await userSnapshot(
      client,
      targetId,
    );

    await audit(
      client,
      actor.id,
      targetId,
      "USUARIO_APROBADO",
      before,
      after,
      `Rol: ${input.role}`,
      ip,
    );

    return after;
  });
}

export async function updateUserAccess(
  targetId: string,
  input: {
    role: ManagedRole;
    branchIds: string[];
  },
  actor: AdminAuthUser,
  ip?: string,
) {
  return withTransaction(async (client) => {
    await lockUserState(
      client,
      targetId,
    );

    const before = await userSnapshot(
      client,
      targetId,
    );

    await applyAccess(
      client,
      targetId,
      input,
      actor,
      false,
    );

    const after = await userSnapshot(
      client,
      targetId,
    );

    await audit(
      client,
      actor.id,
      targetId,
      "ACCESO_USUARIO_ACTUALIZADO",
      before,
      after,
      `Rol: ${input.role}`,
      ip,
    );

    return after;
  });
}

export async function blockUser(
  targetId: string,
  reason: string,
  actor: AdminAuthUser,
  ip?: string,
) {
  if (targetId === actor.id) {
    throw new AdminServiceError(
      "SELF_BLOCK",
      "No puedes bloquear tu propia cuenta.",
    );
  }

  return withTransaction(async (client) => {
    const currentState =
      await lockUserState(
        client,
        targetId,
      );

    assertStateTransition(
      currentState,
      "BLOCK",
    );

    const before = await userSnapshot(
      client,
      targetId,
    );

    await assertCanRemoveActiveSuperadmin(
      client,
      targetId,
    );

    await client.query(
      `
        UPDATE usuarios
        SET
          estado = 'BLOQUEADO',
          bloqueado_en = NOW(),
          bloqueado_por = $1,
          motivo_bloqueo = $2,
          actualizado_en = NOW()
        WHERE id = $3
      `,
      [actor.id, reason, targetId],
    );

    await client.query(
      `
        UPDATE sesiones
        SET
          revocada_en = COALESCE(revocada_en, NOW()),
          revocada_por = $1,
          motivo_revocacion = COALESCE(
            motivo_revocacion,
            'USUARIO_BLOQUEADO'
          )
        WHERE usuario_id = $2
          AND revocada_en IS NULL
      `,
      [actor.id, targetId],
    );

    const after = await userSnapshot(
      client,
      targetId,
    );

    await audit(
      client,
      actor.id,
      targetId,
      "USUARIO_BLOQUEADO",
      before,
      after,
      reason,
      ip,
    );

    return after;
  });
}

export async function unblockUser(
  targetId: string,
  actor: AdminAuthUser,
  ip?: string,
) {
  return withTransaction(async (client) => {
    const currentState =
      await lockUserState(
        client,
        targetId,
      );

    assertStateTransition(
      currentState,
      "UNBLOCK",
    );

    const before = await userSnapshot(
      client,
      targetId,
    );

    await client.query(
      `
        UPDATE usuarios
        SET
          estado = 'ACTIVO',
          bloqueado_en = NULL,
          bloqueado_por = NULL,
          motivo_bloqueo = NULL,
          actualizado_en = NOW()
        WHERE id = $1
      `,
      [targetId],
    );

    const after = await userSnapshot(
      client,
      targetId,
    );

    await audit(
      client,
      actor.id,
      targetId,
      "USUARIO_DESBLOQUEADO",
      before,
      after,
      undefined,
      ip,
    );

    return after;
  });
}

export async function revokeUserSessions(
  targetId: string,
  actor: AdminAuthUser,
  ip?: string,
) {
  return withTransaction(async (client) => {
    const target = await userSnapshot(
      client,
      targetId,
    );

    if (!target) {
      throw new AdminServiceError(
        "NOT_FOUND",
        "El usuario no existe.",
      );
    }

    const result = await client.query(
      `
        UPDATE sesiones
        SET
          revocada_en = COALESCE(revocada_en, NOW()),
          revocada_por = $1,
          motivo_revocacion = 'REVOCACION_ADMINISTRATIVA'
        WHERE usuario_id = $2
          AND revocada_en IS NULL
        RETURNING id
      `,
      [actor.id, targetId],
    );

    const revoked =
      result.rowCount ?? 0;

    await audit(
      client,
      actor.id,
      targetId,
      "SESIONES_REVOCADAS",
      null,
      {
        sesionesRevocadas: revoked,
      },
      undefined,
      ip,
    );

    return {
      revoked,
    };
  });
}

export async function setBranchActiveState(
  branchId: string,
  active: boolean,
  actor: AdminAuthUser,
  ip?: string,
) {
  return withTransaction(async (client) => {
    const result = await client.query<{
      id: string;
      codigo: string;
      nombre: string;
      activa: boolean;
    }>(
      `
        SELECT
          id,
          codigo,
          nombre,
          activa
        FROM sucursales
        WHERE id = $1
        FOR UPDATE
      `,
      [branchId],
    );

    const before = result.rows[0];

    if (!before) {
      throw new AdminServiceError(
        "BRANCH_NOT_FOUND",
        "La sucursal no existe.",
      );
    }

    if (before.activa === active) {
      return before;
    }

    const updateResult = await client.query<{
      id: string;
      codigo: string;
      nombre: string;
      activa: boolean;
    }>(
      `
        UPDATE sucursales
        SET
          activa = $1,
          actualizado_en = NOW()
        WHERE id = $2
        RETURNING
          id,
          codigo,
          nombre,
          activa
      `,
      [active, branchId],
    );

    const after = updateResult.rows[0];

    await audit(
      client,
      actor.id,
      null,
      active
        ? "SUCURSAL_REACTIVADA"
        : "SUCURSAL_DESACTIVADA",
      before,
      after,
      `${before.codigo} · ${before.nombre}`,
      ip,
    );

    return after;
  });
}
