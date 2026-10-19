import { pool } from "../db/pool.js";
import type {
  AttentionKey,
  InventoryAuthUser,
  InventoryQuery,
} from "../types/inventory.js";

export class InventoryServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "InventoryServiceError";
  }
}

type BranchScope = string[] | null;

function isSuperAdmin(user: InventoryAuthUser): boolean {
  return user.roles.includes("SUPERADMIN");
}

function isManager(user: InventoryAuthUser): boolean {
  return (
    user.roles.includes("SUPERADMIN") ||
    user.roles.includes("GERENTE")
  );
}

function resolveBranchScope(
  user: InventoryAuthUser,
  requestedBranchId?: string,
): BranchScope {
  if (isSuperAdmin(user)) {
    return requestedBranchId ? [requestedBranchId] : null;
  }

  const assigned = user.sucursales.map((branch) => branch.id);

  if (
    requestedBranchId &&
    !assigned.includes(requestedBranchId)
  ) {
    throw new InventoryServiceError(
      "BRANCH_NOT_ALLOWED",
      "No tienes acceso a la sucursal seleccionada.",
    );
  }

  return requestedBranchId ? [requestedBranchId] : assigned;
}

function scopeCondition(
  scope: BranchScope,
  alias: string,
  startAt = 1,
) {
  if (scope === null) {
    return {
      sql: "",
      params: [] as unknown[],
      next: startAt,
    };
  }

  if (scope.length === 0) {
    return {
      sql: " AND FALSE",
      params: [] as unknown[],
      next: startAt,
    };
  }

  return {
    sql: ` AND ${alias}.sucursal_id = ANY($${startAt}::uuid[])`,
    params: [scope] as unknown[],
    next: startAt + 1,
  };
}

function equipmentSelect() {
  return `
    SELECT
      e.id,
      e.numero_inventario AS "numeroInventario",
      e.marca,
      e.modelo,
      e.numero_serie AS "numeroSerie",
      e.hostname,
      e.direccion_ip::text AS "direccionIp",
      e.sistema_operativo AS "sistemaOperativo",
      e.anydesk,
      e.responsable,
      e.ubicacion_exacta AS "ubicacionExacta",
      e.observaciones,
      e.activo,
      e.version,
      e.factura_partida AS "facturaPartida",
      e.importe_adquisicion::float8 AS "importeAdquisicion",
      e.creado_por AS "creadoPor",
      e.creado_en AS "creadoEn",
      e.actualizado_en AS "actualizadoEn",
      e.baja_en AS "bajaEn",
      e.detalle_baja AS "detalleBaja",

      mb.id AS "motivoBajaId",
      mb.codigo AS "motivoBajaCodigo",
      mb.nombre AS "motivoBajaNombre",

      te.id AS "tipoEquipoId",
      te.codigo AS "tipoCodigo",
      te.nombre AS "tipoNombre",

      s.id AS "sucursalId",
      s.codigo AS "sucursalCodigo",
      s.nombre AS "sucursalNombre",

      d.id AS "departamentoId",
      d.codigo AS "departamentoCodigo",
      d.nombre AS "departamentoNombre",

      ef.id AS "estadoId",
      ef.codigo AS "estadoCodigo",
      ef.nombre AS "estadoNombre",

      cf.id AS "condicionId",
      cf.codigo AS "condicionCodigo",
      cf.nombre AS "condicionNombre",

      ti.id AS "incorporacionId",
      ti.codigo AS "incorporacionCodigo",
      ti.nombre AS "incorporacionNombre",

      f.id AS "facturaId",
      f.numero_factura AS "facturaNumero",
      f.fecha_factura AS "facturaFecha",
      f.proveedor_nombre AS "facturaProveedor",
      f.razon_social AS "facturaRazonSocial",
      f.moneda AS "facturaMoneda",
      f.total::float8 AS "facturaTotal"

    FROM equipos_ti e
    INNER JOIN tipos_equipo te
      ON te.id = e.tipo_equipo_id
    INNER JOIN sucursales s
      ON s.id = e.sucursal_id
    INNER JOIN departamentos d
      ON d.id = e.departamento_id
    INNER JOIN estados_funcionamiento ef
      ON ef.id = e.estado_funcionamiento_id
    INNER JOIN condiciones_fisicas cf
      ON cf.id = e.condicion_fisica_id
    INNER JOIN tipos_incorporacion ti
      ON ti.id = e.tipo_incorporacion_id
    LEFT JOIN facturas_compra_ti f
      ON f.id = e.factura_compra_id
    LEFT JOIN motivos_baja_equipo mb
      ON mb.id = e.motivo_baja_id
  `;
}

async function getVisibleBranches(
  user: InventoryAuthUser,
) {
  if (isSuperAdmin(user)) {
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

  const ids = user.sucursales.map(
    (branch) => branch.id,
  );

  if (!ids.length) {
    return [];
  }

  const result = await pool.query<{
    id: string;
    codigo: string;
    nombre: string;
  }>(
    `
      SELECT id, codigo, nombre, activa
      FROM sucursales
      WHERE id = ANY($1::uuid[])
      ORDER BY activa DESC, nombre
    `,
    [ids],
  );

  return result.rows;
}

function historyLabel(event: string) {
  switch (event) {
    case "ALTA":
      return "fue registrado";
    case "EDICION":
      return "fue actualizado";
    case "CAMBIO_ESTADO":
      return "cambió de estado";
    case "REASIGNACION":
      return "cambió de asignación";
    case "BAJA":
      return "fue dado de baja";
    case "REACTIVACION":
      return "fue reactivado";
    default:
      return "registró actividad";
  }
}

export async function getInventoryOverview(
  user: InventoryAuthUser,
  requestedBranchId?: string,
) {
  if (!isManager(user)) {
    throw new InventoryServiceError(
      "FORBIDDEN",
      "No tienes acceso al Centro de Operaciones.",
    );
  }

  const scope = resolveBranchScope(user, requestedBranchId);
  const scoped = scopeCondition(scope, "e");

  const totalsPromise = pool.query<{
    total: number;
    activos: number;
    inactivos: number;
    operativos: number;
    observaciones: number;
    noOperativos: number;
    sinResponsable: number;
    facturaPendiente: number;
    danoFisico: number;
    requierenAtencion: number;
  }>(
    `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE e.activo = TRUE)::int AS activos,
        COUNT(*) FILTER (WHERE e.activo = FALSE)::int AS inactivos,
        COUNT(*) FILTER (
          WHERE e.activo = TRUE
            AND ef.codigo = 'OPERATIVO'
        )::int AS operativos,
        COUNT(*) FILTER (
          WHERE e.activo = TRUE
            AND ef.codigo = 'OPERATIVO_OBSERVACIONES'
        )::int AS observaciones,
        COUNT(*) FILTER (
          WHERE e.activo = TRUE
            AND ef.codigo = 'NO_OPERATIVO'
        )::int AS "noOperativos",
        COUNT(*) FILTER (
          WHERE e.activo = TRUE
            AND COALESCE(TRIM(e.responsable), '') = ''
        )::int AS "sinResponsable",
        COUNT(*) FILTER (
          WHERE e.activo = TRUE
            AND ti.codigo = 'COMPRA_NUEVA'
            AND e.factura_compra_id IS NULL
        )::int AS "facturaPendiente",
        COUNT(*) FILTER (
          WHERE e.activo = TRUE
            AND cf.codigo = 'DANO_RELEVANTE'
        )::int AS "danoFisico",
        COUNT(*) FILTER (
          WHERE e.activo = TRUE
            AND (
              ef.codigo IN ('NO_OPERATIVO','OPERATIVO_OBSERVACIONES')
              OR cf.codigo = 'DANO_RELEVANTE'
              OR COALESCE(TRIM(e.responsable), '') = ''
              OR (
                ti.codigo = 'COMPRA_NUEVA'
                AND e.factura_compra_id IS NULL
              )
            )
        )::int AS "requierenAtencion"
      FROM equipos_ti e
      INNER JOIN estados_funcionamiento ef
        ON ef.id = e.estado_funcionamiento_id
      INNER JOIN condiciones_fisicas cf
        ON cf.id = e.condicion_fisica_id
      INNER JOIN tipos_incorporacion ti
        ON ti.id = e.tipo_incorporacion_id
      WHERE TRUE
      ${scoped.sql}
    `,
    scoped.params,
  );

  const statusPromise = pool.query<{
    codigo: string;
    nombre: string;
    value: number;
  }>(
    `
      SELECT
        ef.codigo,
        ef.nombre,
        COUNT(*)::int AS value
      FROM equipos_ti e
      INNER JOIN estados_funcionamiento ef
        ON ef.id = e.estado_funcionamiento_id
      WHERE e.activo = TRUE
      ${scoped.sql}
      GROUP BY ef.id, ef.codigo, ef.nombre, ef.orden
      ORDER BY ef.orden, ef.nombre
    `,
    scoped.params,
  );

  const byTypePromise = pool.query(
    `
      SELECT
        te.id,
        te.codigo,
        te.nombre,
        COUNT(*)::int AS value
      FROM equipos_ti e
      INNER JOIN tipos_equipo te
        ON te.id = e.tipo_equipo_id
      WHERE e.activo = TRUE
      ${scoped.sql}
      GROUP BY te.id, te.codigo, te.nombre, te.orden
      ORDER BY value DESC, te.orden
    `,
    scoped.params,
  );

  const byBranchPromise = pool.query(
    `
      SELECT
        s.id,
        s.codigo,
        s.nombre,
        COUNT(*)::int AS value
      FROM equipos_ti e
      INNER JOIN sucursales s
        ON s.id = e.sucursal_id
      WHERE e.activo = TRUE
      ${scoped.sql}
      GROUP BY s.id, s.codigo, s.nombre
      ORDER BY value DESC, s.nombre
    `,
    scoped.params,
  );

  const byDepartmentPromise = pool.query(
    `
      SELECT
        d.id,
        d.codigo,
        d.nombre,
        COUNT(*)::int AS value
      FROM equipos_ti e
      INNER JOIN departamentos d
        ON d.id = e.departamento_id
      WHERE e.activo = TRUE
      ${scoped.sql}
      GROUP BY d.id, d.codigo, d.nombre
      ORDER BY value DESC, d.nombre
      LIMIT 12
    `,
    scoped.params,
  );

  const recentAssetsPromise = pool.query(
    `
      ${equipmentSelect()}
      WHERE TRUE
      ${scoped.sql}
      ORDER BY e.creado_en DESC
      LIMIT 6
    `,
    scoped.params,
  );

  const historyScope = scopeCondition(scope, "h");

  const recentActivityPromise = pool.query<{
    id: string;
    evento: string;
    equipmentId: string;
    numeroInventario: string;
    marca: string;
    modelo: string | null;
    branch: string;
    occurredAt: string;
  }>(
    `
      SELECT
        h.id,
        h.evento,
        e.id AS "equipmentId",
        e.numero_inventario AS "numeroInventario",
        e.marca,
        e.modelo,
        s.nombre AS branch,
        h.creado_en AS "occurredAt"
      FROM historial_equipos h
      INNER JOIN equipos_ti e
        ON e.id = h.equipo_id
      INNER JOIN sucursales s
        ON s.id = e.sucursal_id
      WHERE TRUE
      ${historyScope.sql}
      ORDER BY h.creado_en DESC
      LIMIT 5
    `,
    historyScope.params,
  );

  const [
    totalsResult,
    statusResult,
    byTypeResult,
    byBranchResult,
    byDepartmentResult,
    recentAssetsResult,
    activityResult,
    branches,
  ] = await Promise.all([
    totalsPromise,
    statusPromise,
    byTypePromise,
    byBranchPromise,
    byDepartmentPromise,
    recentAssetsPromise,
    recentActivityPromise,
    getVisibleBranches(user),
  ]);

  const totals = totalsResult.rows[0] ?? {
    noOperativos: 0,
    observaciones: 0,
    sinResponsable: 0,
    facturaPendiente: 0,
    danoFisico: 0,
  };

  if (!totals) {
    throw new Error(
      "La consulta de resumen del inventario no devolvió resultados.",
    );
  }

  const attention = [
    {
      key: "no_operativo" as const,
      label: "No operativos",
      count: totals.noOperativos,
      tone: "danger" as const,
    },
    {
      key: "observaciones" as const,
      label: "Operativos con observaciones",
      count: totals.observaciones,
      tone: "warning" as const,
    },
    {
      key: "sin_responsable" as const,
      label: "Sin responsable",
      count: totals.sinResponsable,
      tone: "neutral" as const,
    },
    {
      key: "factura_pendiente" as const,
      label: "Compra con factura pendiente",
      count: totals.facturaPendiente,
      tone: "neutral" as const,
    },
    {
      key: "dano_fisico" as const,
      label: "Daño físico relevante",
      count: totals.danoFisico,
      tone: "warning" as const,
    },
  ].filter((item) => item.count > 0);

  return {
    scope: {
      requestedBranchId: requestedBranchId ?? null,
      allBranches: isSuperAdmin(user) && !requestedBranchId,
      hasAssignments:
        isSuperAdmin(user) ||
        user.sucursales.length > 0,
    },
    branches,
    totals,
    statusDistribution: statusResult.rows,
    attention,
    distribution: {
      byType: byTypeResult.rows,
      byBranch: byBranchResult.rows,
      byDepartment: byDepartmentResult.rows,
    },
    recentAssets: recentAssetsResult.rows,
    recentActivity: activityResult.rows.map((row) => ({
      id: row.id,
      type: row.evento.toLowerCase(),
      equipmentId: row.equipmentId,
      title: `${row.numeroInventario} ${historyLabel(row.evento)}`,
      detail: [row.marca, row.modelo].filter(Boolean).join(" · "),
      branch: row.branch,
      occurredAt: row.occurredAt,
    })),
  };
}

function buildInventoryFilters(
  user: InventoryAuthUser,
  query: InventoryQuery,
) {
  if (!isManager(user)) {
    throw new InventoryServiceError(
      "FORBIDDEN",
      "No tienes acceso al inventario global.",
    );
  }

  const scope = resolveBranchScope(user, query.branchId);
  const params: unknown[] = [];
  const conditions = ["TRUE"];

  if (scope !== null) {
    if (!scope.length) {
      conditions.push("FALSE");
    } else {
      params.push(scope);
      conditions.push(
        `e.sucursal_id = ANY($${params.length}::uuid[])`,
      );
    }
  }

  const active = query.active ?? "active";

  if (active === "active") {
    conditions.push("e.activo = TRUE");
  } else if (active === "inactive") {
    conditions.push("e.activo = FALSE");
  }

  if (query.search?.trim()) {
    params.push(`%${query.search.trim()}%`);
    const p = `$${params.length}`;

    conditions.push(`
      (
        e.numero_inventario ILIKE ${p}
        OR e.numero_serie ILIKE ${p}
        OR COALESCE(e.hostname, '') ILIKE ${p}
        OR e.marca ILIKE ${p}
        OR COALESCE(e.modelo, '') ILIKE ${p}
        OR COALESCE(e.responsable, '') ILIKE ${p}
      )
    `);
  }

  if (query.typeCode) {
    params.push(query.typeCode);
    conditions.push(`te.codigo = $${params.length}`);
  }

  if (query.departmentId) {
    params.push(query.departmentId);
    conditions.push(
      `e.departamento_id = $${params.length}::uuid`,
    );
  }

  if (query.statusCode) {
    params.push(query.statusCode);
    conditions.push(`ef.codigo = $${params.length}`);
  }

  if (query.attention) {
    const map: Record<AttentionKey, string> = {
      no_operativo:
        "ef.codigo = 'NO_OPERATIVO'",
      observaciones:
        "ef.codigo = 'OPERATIVO_OBSERVACIONES'",
      sin_responsable:
        "COALESCE(TRIM(e.responsable), '') = ''",
      factura_pendiente:
        "ti.codigo = 'COMPRA_NUEVA' AND e.factura_compra_id IS NULL",
      dano_fisico:
        "cf.codigo = 'DANO_RELEVANTE'",
    };

    conditions.push(map[query.attention]);
  }

  return {
    params,
    where: conditions.join(" AND "),
  };
}

export async function listInventory(
  user: InventoryAuthUser,
  query: InventoryQuery,
) {
  const { params, where } =
    buildInventoryFilters(user, query);

  const limit = Math.min(
    Math.max(query.limit ?? 30, 1),
    100,
  );

  const offset = Math.max(
    query.offset ?? 0,
    0,
  );

  const countResult = await pool.query<{ total: number }>(
    `
      SELECT COUNT(*)::int AS total
      FROM equipos_ti e
      INNER JOIN tipos_equipo te
        ON te.id = e.tipo_equipo_id
      INNER JOIN estados_funcionamiento ef
        ON ef.id = e.estado_funcionamiento_id
      INNER JOIN condiciones_fisicas cf
        ON cf.id = e.condicion_fisica_id
      INNER JOIN tipos_incorporacion ti
        ON ti.id = e.tipo_incorporacion_id
      WHERE ${where}
    `,
    params,
  );

  const listParams = [...params, limit, offset];

  const result = await pool.query(
    `
      ${equipmentSelect()}
      WHERE ${where}
      ORDER BY e.actualizado_en DESC, e.creado_en DESC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `,
    listParams,
  );

  return {
    items: result.rows,
    total: countResult.rows[0]?.total ?? 0,
    limit,
    offset,
  };
}

export async function listMyEquipment(
  user: InventoryAuthUser,
) {
  const result = await pool.query(
    `
      ${equipmentSelect()}
      WHERE e.creado_por = $1
      ORDER BY e.creado_en DESC
      LIMIT 20
    `,
    [user.id],
  );

  return result.rows;
}

async function getEquipmentHistory(id: string) {
  const result = await pool.query(
    `
      SELECT
        h.id,
        h.evento,
        h.detalle,
        h.version_anterior AS "versionAnterior",
        h.version_nueva AS "versionNueva",
        h.creado_en AS "creadoEn",
        u.id AS "usuarioId",
        u.nombre AS "usuarioNombre",
        u.apellido_paterno AS "usuarioApellidoPaterno"
      FROM historial_equipos h
      LEFT JOIN usuarios u
        ON u.id = h.usuario_id
      WHERE h.equipo_id = $1
      ORDER BY h.creado_en DESC
      LIMIT 100
    `,
    [id],
  );

  return result.rows;
}

export async function getInventoryEquipment(
  user: InventoryAuthUser,
  id: string,
) {
  const result = await pool.query(
    `
      ${equipmentSelect()}
      WHERE e.id = $1
      LIMIT 1
    `,
    [id],
  );

  const equipment = result.rows[0];

  if (!equipment) {
    throw new InventoryServiceError(
      "NOT_FOUND",
      "El equipo no existe.",
    );
  }

  const canSee =
    isSuperAdmin(user) ||
    (
      user.roles.includes("GERENTE") &&
      user.sucursales.some(
        (branch) => branch.id === equipment.sucursalId,
      )
    ) ||
    equipment.creadoPor === user.id;

  if (!canSee) {
    throw new InventoryServiceError(
      "FORBIDDEN",
      "No tienes acceso a este equipo.",
    );
  }

  return {
    ...equipment,
    history: await getEquipmentHistory(id),
  };
}
