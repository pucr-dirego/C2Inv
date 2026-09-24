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

async function audit(
  actorId: string,
  targetId: string | null,
  action: string,
  before: unknown,
  after: unknown,
  detail?: string,
  ip?: string,
) {
  await pool.query(
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
      before ? JSON.stringify(before) : null,
      after ? JSON.stringify(after) : null,
      detail ?? null,
      ip ?? null,
    ],
  );
}

async function userSnapshot(userId: string) {
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
              'nombre', s.nombre
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
        AND s.activa = TRUE
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
              'nombre', s.nombre
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
        AND s.activa = TRUE
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
      SELECT id, codigo, nombre
      FROM sucursales
      WHERE activa = TRUE
      ORDER BY nombre
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

async function applyAccess(
  targetId: string,
  input: {
    role: ManagedRole;
    branchIds: string[];
  },
  actor: AdminAuthUser,
  approve: boolean,
) {
  if (
    input.role !== "SUPERADMIN" &&
    input.branchIds.length === 0
  ) {
    throw new AdminServiceError(
      "BRANCH_REQUIRED",
      "Asigna al menos una sucursal.",
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const roleResult = await client.query<{ id: string }>(
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

    for (const branchId of input.branchIds) {
      await client.query(
        `
          INSERT INTO usuarios_sucursales (
            usuario_id,
            sucursal_id,
            asignada_en,
            asignada_por
          )
          VALUES ($1, $2, NOW(), $3)
          ON CONFLICT (usuario_id, sucursal_id)
          DO UPDATE SET
            asignada_por = EXCLUDED.asignada_por
        `,
        [targetId, branchId, actor.id],
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
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
  const before = await userSnapshot(targetId);

  if (!before) {
    throw new AdminServiceError(
      "NOT_FOUND",
      "El usuario no existe.",
    );
  }

  await applyAccess(
    targetId,
    input,
    actor,
    true,
  );

  const after = await userSnapshot(targetId);

  await audit(
    actor.id,
    targetId,
    "USUARIO_APROBADO",
    before,
    after,
    `Rol: ${input.role}`,
    ip,
  );

  return after;
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
  const before = await userSnapshot(targetId);

  if (!before) {
    throw new AdminServiceError(
      "NOT_FOUND",
      "El usuario no existe.",
    );
  }

  await applyAccess(
    targetId,
    input,
    actor,
    false,
  );

  const after = await userSnapshot(targetId);

  await audit(
    actor.id,
    targetId,
    "ACCESO_USUARIO_ACTUALIZADO",
    before,
    after,
    `Rol: ${input.role}`,
    ip,
  );

  return after;
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

  const before = await userSnapshot(targetId);

  if (!before) {
    throw new AdminServiceError(
      "NOT_FOUND",
      "El usuario no existe.",
    );
  }

  await pool.query(
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

  const after = await userSnapshot(targetId);

  await audit(
    actor.id,
    targetId,
    "USUARIO_BLOQUEADO",
    before,
    after,
    reason,
    ip,
  );

  return after;
}

export async function unblockUser(
  targetId: string,
  actor: AdminAuthUser,
  ip?: string,
) {
  const before = await userSnapshot(targetId);

  if (!before) {
    throw new AdminServiceError(
      "NOT_FOUND",
      "El usuario no existe.",
    );
  }

  await pool.query(
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

  const after = await userSnapshot(targetId);

  await audit(
    actor.id,
    targetId,
    "USUARIO_DESBLOQUEADO",
    before,
    after,
    undefined,
    ip,
  );

  return after;
}

export async function revokeUserSessions(
  targetId: string,
  actor: AdminAuthUser,
  ip?: string,
) {
  const result = await pool.query(
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

  await audit(
    actor.id,
    targetId,
    "SESIONES_REVOCADAS",
    null,
    {
      sesionesRevocadas: result.rowCount ?? 0,
    },
    undefined,
    ip,
  );

  return {
    revoked: result.rowCount ?? 0,
  };
}
