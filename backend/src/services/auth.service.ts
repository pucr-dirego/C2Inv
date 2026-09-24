import * as argon2 from "argon2";
import { createHash, randomBytes } from "node:crypto";

import { pool } from "../db/pool.js";
import type {
  AuthenticatedUser,
  LoginInput,
  LoginResult,
  RegisterInput,
  RegisterResult,
} from "../types/auth.js";

export class AuthServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AuthServiceError";
  }
}

function hashSessionToken(token: string): string {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

function getSessionTtlMilliseconds(): number {
  const hours = Number(
    process.env.SESSION_TTL_HOURS ?? 12,
  );

  return hours * 60 * 60 * 1000;
}

async function getUserContext(
  userId: string,
): Promise<AuthenticatedUser> {
  const userResult = await pool.query<{
    id: string;
    nombre: string;
    apellido_paterno: string | null;
    apellido_materno: string | null;
    correo: string;
    estado: "ACTIVO";
  }>(
    `
      SELECT
        id,
        nombre,
        apellido_paterno,
        apellido_materno,
        correo,
        estado
      FROM usuarios
      WHERE id = $1
        AND estado = 'ACTIVO'
      LIMIT 1
    `,
    [userId],
  );

  const user = userResult.rows[0];

  if (!user) {
    throw new AuthServiceError(
      "ACCOUNT_NOT_ACTIVE",
      "La cuenta no está activa.",
    );
  }

  const rolesResult = await pool.query<{ codigo: string }>(
    `
      SELECT r.codigo
      FROM roles r
      INNER JOIN usuarios_roles ur
        ON ur.rol_id = r.id
      WHERE ur.usuario_id = $1
        AND r.activo = TRUE
      ORDER BY
        CASE r.codigo
          WHEN 'SUPERADMIN' THEN 1
          WHEN 'GERENTE' THEN 2
          WHEN 'USUARIO' THEN 3
          ELSE 99
        END
    `,
    [userId],
  );

  const branchesResult = await pool.query<{
    id: string;
    codigo: string;
    nombre: string;
  }>(
    `
      SELECT
        s.id,
        s.codigo,
        s.nombre
      FROM sucursales s
      INNER JOIN usuarios_sucursales us
        ON us.sucursal_id = s.id
      WHERE us.usuario_id = $1
        AND s.activa = TRUE
      ORDER BY s.nombre
    `,
    [userId],
  );

  return {
    id: user.id,
    nombre: user.nombre,
    apellidoPaterno: user.apellido_paterno,
    apellidoMaterno: user.apellido_materno,
    correo: user.correo,
    estado: user.estado,
    roles: rolesResult.rows.map((row) => row.codigo),
    sucursales: branchesResult.rows,
  };
}

export async function listRegistrationBranches(): Promise<Array<{
  id: string;
  codigo: string;
  nombre: string;
}>> {
  const result = await pool.query<{
    id: string;
    codigo: string;
    nombre: string;
  }>(`
    SELECT id, codigo, nombre
    FROM sucursales
    WHERE activa = TRUE
    ORDER BY nombre
  `);

  return result.rows;
}

export async function registerUser(
  input: RegisterInput,
): Promise<RegisterResult> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const correo = input.correo.trim().toLowerCase();
    const nombre = input.nombre.trim();
    const apellidoPaterno = input.apellidoPaterno?.trim() || null;
    const apellidoMaterno = input.apellidoMaterno?.trim() || null;

    const branchResult = await client.query<{
      id: string;
      codigo: string;
      nombre: string;
    }>(
      `
        SELECT id, codigo, nombre
        FROM sucursales
        WHERE id = $1
          AND activa = TRUE
        LIMIT 1
      `,
      [input.sucursalId],
    );

    const branch = branchResult.rows[0];

    if (!branch) {
      throw new AuthServiceError(
        "BRANCH_NOT_FOUND",
        "La sucursal seleccionada no está disponible.",
      );
    }

    const existing = await client.query(
      `
        SELECT id
        FROM usuarios
        WHERE LOWER(correo) = LOWER($1)
        LIMIT 1
      `,
      [correo],
    );

    if ((existing.rowCount ?? 0) > 0) {
      throw new AuthServiceError(
        "EMAIL_IN_USE",
        "El correo ya está registrado.",
      );
    }

    const passwordHash = await argon2.hash(
      input.password,
      {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 1,
      },
    );

    const userResult = await client.query<{
      id: string;
      nombre: string;
      correo: string;
      estado: "PENDIENTE";
    }>(
      `
        INSERT INTO usuarios (
          nombre,
          apellido_paterno,
          apellido_materno,
          correo,
          estado
        )
        VALUES ($1, $2, $3, $4, 'PENDIENTE')
        RETURNING id, nombre, correo, estado
      `,
      [nombre, apellidoPaterno, apellidoMaterno, correo],
    );

    const user = userResult.rows[0];

    if (!user) {
      throw new Error("No fue posible crear el usuario.");
    }

    await client.query(
      `
        INSERT INTO usuarios_passwords (
          usuario_id,
          password_hash
        )
        VALUES ($1, $2)
      `,
      [user.id, passwordHash],
    );

    const roleResult = await client.query<{ id: string }>(
      `
        SELECT id
        FROM roles
        WHERE codigo = 'USUARIO'
          AND activo = TRUE
        LIMIT 1
      `,
    );

    const roleId = roleResult.rows[0]?.id;

    if (!roleId) {
      throw new Error("No existe el rol USUARIO.");
    }

    await client.query(
      `
        INSERT INTO usuarios_roles (
          usuario_id,
          rol_id
        )
        VALUES ($1, $2)
      `,
      [user.id, roleId],
    );

    await client.query(
      `
        INSERT INTO usuarios_sucursales (
          usuario_id,
          sucursal_id,
          asignada_en,
          asignada_por
        )
        VALUES ($1, $2, NOW(), NULL)
        ON CONFLICT (usuario_id, sucursal_id)
        DO NOTHING
      `,
      [user.id, branch.id],
    );

    await client.query("COMMIT");

    return {
      id: user.id,
      nombre: user.nombre,
      correo: user.correo,
      estado: user.estado,
      sucursal: branch,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function loginUser(
  input: LoginInput,
  metadata: {
    ip?: string;
    userAgent?: string;
  },
): Promise<LoginResult> {
  const correo = input.correo.trim().toLowerCase();

  const result = await pool.query<{
    id: string;
    estado: string;
    password_hash: string;
  }>(
    `
      SELECT
        u.id,
        u.estado,
        up.password_hash
      FROM usuarios u
      INNER JOIN usuarios_passwords up
        ON up.usuario_id = u.id
      WHERE LOWER(u.correo) = LOWER($1)
      LIMIT 1
    `,
    [correo],
  );

  const account = result.rows[0];

  if (!account) {
    throw new AuthServiceError(
      "INVALID_CREDENTIALS",
      "Correo o contraseña incorrectos.",
    );
  }

  const valid = await argon2.verify(
    account.password_hash,
    input.password,
  );

  if (!valid) {
    throw new AuthServiceError(
      "INVALID_CREDENTIALS",
      "Correo o contraseña incorrectos.",
    );
  }

  if (account.estado === "PENDIENTE") {
    throw new AuthServiceError(
      "ACCOUNT_PENDING",
      "La cuenta está pendiente de aprobación.",
    );
  }

  if (account.estado === "BLOQUEADO") {
    throw new AuthServiceError(
      "ACCOUNT_BLOCKED",
      "La cuenta está bloqueada.",
    );
  }

  if (account.estado !== "ACTIVO") {
    throw new AuthServiceError(
      "ACCOUNT_NOT_ACTIVE",
      "La cuenta no está activa.",
    );
  }

  const user = await getUserContext(account.id);
  const token = randomBytes(48).toString("base64url");
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(
    Date.now() + getSessionTtlMilliseconds(),
  );

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
        INSERT INTO sesiones (
          usuario_id,
          token_hash,
          ip,
          user_agent,
          expira_en,
          ultimo_uso_en
        )
        VALUES ($1, $2, $3, $4, $5, NOW())
      `,
      [
        account.id,
        tokenHash,
        metadata.ip ?? null,
        metadata.userAgent ?? null,
        expiresAt,
      ],
    );

    await client.query(
      `
        UPDATE usuarios
        SET
          ultimo_login_en = NOW(),
          actualizado_en = NOW()
        WHERE id = $1
      `,
      [account.id],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return {
    token,
    expiresAt,
    user,
  };
}

export async function getUserFromSession(
  token: string,
): Promise<AuthenticatedUser | null> {
  const tokenHash = hashSessionToken(token);

  const sessionResult = await pool.query<{
    id: string;
    usuario_id: string;
  }>(
    `
      SELECT
        id,
        usuario_id
      FROM sesiones
      WHERE token_hash = $1
        AND revocada_en IS NULL
        AND expira_en > NOW()
      LIMIT 1
    `,
    [tokenHash],
  );

  const session = sessionResult.rows[0];

  if (!session) {
    return null;
  }

  try {
    const user = await getUserContext(session.usuario_id);

    await pool.query(
      `
        UPDATE sesiones
        SET ultimo_uso_en = NOW()
        WHERE id = $1
      `,
      [session.id],
    );

    return user;
  } catch {
    await pool.query(
      `
        UPDATE sesiones
        SET
          revocada_en = COALESCE(revocada_en, NOW()),
          motivo_revocacion = COALESCE(
            motivo_revocacion,
            'CUENTA_NO_VALIDA'
          )
        WHERE id = $1
      `,
      [session.id],
    );

    return null;
  }
}

export async function revokeSession(
  token: string,
): Promise<void> {
  const tokenHash = hashSessionToken(token);

  await pool.query(
    `
      UPDATE sesiones
      SET
        revocada_en = COALESCE(revocada_en, NOW()),
        motivo_revocacion = COALESCE(
          motivo_revocacion,
          'LOGOUT'
        )
      WHERE token_hash = $1
    `,
    [tokenHash],
  );
}
