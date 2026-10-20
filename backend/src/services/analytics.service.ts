import { pool } from "../db/pool.js";
import type { InventoryAuthUser } from "../types/inventory.js";
import type {
  AnalyticsBranch,
  AnalyticsBreakdownItem,
  AnalyticsCountryCode,
  AnalyticsGeographyData,
} from "../types/analytics.js";

export class AnalyticsServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AnalyticsServiceError";
  }
}

type BranchScope = string[] | null;

type BranchRow = {
  id: string;
  code: string;
  name: string;
  country: AnalyticsCountryCode;
  city: string;
  region: string;
  latitude: number | null;
  longitude: number | null;
  equipment: number;
  active: number;
  operational: number;
  attention: number;
  offline: number;
  lastUpdateAt: string | null;
};

type BreakdownRow = {
  branchId: string;
  label: string;
  value: number;
};

type TrendRow = {
  branchId: string;
  value: number;
};

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
): BranchScope {
  if (isSuperAdmin(user)) {
    return null;
  }

  return user.sucursales.map((branch) => branch.id);
}

function scopeCondition(
  scope: BranchScope,
  alias: string,
  paramIndex: number,
) {
  if (scope === null) {
    return {
      sql: "",
      params: [] as unknown[],
    };
  }

  if (scope.length === 0) {
    return {
      sql: " AND FALSE",
      params: [] as unknown[],
    };
  }

  return {
    sql: ` AND ${alias}.id = ANY($${paramIndex}::uuid[])`,
    params: [scope] as unknown[],
  };
}

function toRelativeLabel(value: string | null): string {
  if (!value) {
    return "Sin movimientos";
  }

  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) {
    return "PostgreSQL";
  }

  const diffMs = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) {
    return "ahora";
  }

  if (minutes < 60) {
    return `hace ${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `hace ${hours} h`;
  }

  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

function addBreakdown(
  target: Map<string, AnalyticsBreakdownItem[]>,
  row: BreakdownRow,
) {
  const current = target.get(row.branchId) ?? [];
  current.push({
    label: row.label,
    value: row.value,
  });
  target.set(row.branchId, current);
}

export async function getAnalyticsGeography(
  user: InventoryAuthUser,
  country: AnalyticsCountryCode,
): Promise<AnalyticsGeographyData> {
  if (!isManager(user)) {
    throw new AnalyticsServiceError(
      "FORBIDDEN",
      "No tienes acceso a la analítica geográfica.",
    );
  }

  const scope = resolveBranchScope(user);
  const scoped = scopeCondition(scope, "s", 2);
  const params = [country, ...scoped.params];

  const branchesPromise = pool.query<BranchRow>(
    `
      SELECT
        s.id,
        s.codigo AS code,
        s.nombre AS name,
        u.pais_codigo AS country,
        u.ciudad AS city,
        u.region,
        u.latitud AS latitude,
        u.longitud AS longitude,

        COUNT(e.id)::int AS equipment,

        COUNT(e.id) FILTER (
          WHERE e.activo = TRUE
        )::int AS active,

        COUNT(e.id) FILTER (
          WHERE e.activo = TRUE
            AND ef.codigo = 'OPERATIVO'
        )::int AS operational,

        COUNT(e.id) FILTER (
          WHERE e.activo = TRUE
            AND ef.codigo = 'OPERATIVO_OBSERVACIONES'
        )::int AS attention,

        COUNT(e.id) FILTER (
          WHERE e.activo = TRUE
            AND ef.codigo IN (
              'NO_OPERATIVO',
              'EN_REPARACION',
              'FUERA_SERVICIO'
            )
        )::int AS offline,

        MAX(e.actualizado_en)::text AS "lastUpdateAt"

      FROM public.sucursales s

      INNER JOIN public.sucursales_ubicaciones u
        ON u.sucursal_id = s.id

      LEFT JOIN public.equipos_ti e
        ON e.sucursal_id = s.id

      LEFT JOIN public.estados_funcionamiento ef
        ON ef.id = e.estado_funcionamiento_id

      WHERE s.activa = TRUE
        AND u.pais_codigo = $1
        ${scoped.sql}

      GROUP BY
        s.id,
        s.codigo,
        s.nombre,
        u.pais_codigo,
        u.ciudad,
        u.region,
        u.latitud,
        u.longitud

      ORDER BY s.nombre ASC
    `,
    params,
  );

  const typePromise = pool.query<BreakdownRow>(
    `
      SELECT
        s.id AS "branchId",
        te.nombre AS label,
        COUNT(e.id)::int AS value

      FROM public.sucursales s

      INNER JOIN public.sucursales_ubicaciones u
        ON u.sucursal_id = s.id

      INNER JOIN public.equipos_ti e
        ON e.sucursal_id = s.id
        AND e.activo = TRUE

      INNER JOIN public.tipos_equipo te
        ON te.id = e.tipo_equipo_id

      WHERE s.activa = TRUE
        AND u.pais_codigo = $1
        ${scoped.sql}

      GROUP BY
        s.id,
        te.id,
        te.nombre,
        te.orden

      ORDER BY
        s.id,
        value DESC,
        te.orden,
        te.nombre
    `,
    params,
  );

  const conditionPromise = pool.query<BreakdownRow>(
    `
      SELECT
        s.id AS "branchId",
        cf.nombre AS label,
        COUNT(e.id)::int AS value

      FROM public.sucursales s

      INNER JOIN public.sucursales_ubicaciones u
        ON u.sucursal_id = s.id

      INNER JOIN public.equipos_ti e
        ON e.sucursal_id = s.id
        AND e.activo = TRUE

      INNER JOIN public.condiciones_fisicas cf
        ON cf.id = e.condicion_fisica_id

      WHERE s.activa = TRUE
        AND u.pais_codigo = $1
        ${scoped.sql}

      GROUP BY
        s.id,
        cf.id,
        cf.nombre,
        cf.orden

      ORDER BY
        s.id,
        cf.orden,
        cf.nombre
    `,
    params,
  );

  const trendPromise = pool.query<TrendRow>(
    `
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', CURRENT_DATE) - interval '7 months',
          date_trunc('month', CURRENT_DATE),
          interval '1 month'
        ) AS month_start
      ),

      visible_branches AS (
        SELECT s.id
        FROM public.sucursales s
        INNER JOIN public.sucursales_ubicaciones u
          ON u.sucursal_id = s.id
        WHERE s.activa = TRUE
          AND u.pais_codigo = $1
          ${scoped.sql}
      )

      SELECT
        vb.id AS "branchId",
        COUNT(e.id) FILTER (
          WHERE e.creado_en < (m.month_start + interval '1 month')
        )::int AS value

      FROM visible_branches vb
      CROSS JOIN months m
      LEFT JOIN public.equipos_ti e
        ON e.sucursal_id = vb.id

      GROUP BY
        vb.id,
        m.month_start

      ORDER BY
        vb.id,
        m.month_start
    `,
    params,
  );

  const [
    branchesResult,
    typeResult,
    conditionResult,
    trendResult,
  ] = await Promise.all([
    branchesPromise,
    typePromise,
    conditionPromise,
    trendPromise,
  ]);

  const typeMap = new Map<string, AnalyticsBreakdownItem[]>();
  const conditionMap = new Map<string, AnalyticsBreakdownItem[]>();
  const trendMap = new Map<string, number[]>();

  typeResult.rows.forEach((row) => {
    addBreakdown(typeMap, row);
  });

  conditionResult.rows.forEach((row) => {
    addBreakdown(conditionMap, row);
  });

  trendResult.rows.forEach((row) => {
    const current = trendMap.get(row.branchId) ?? [];
    current.push(row.value);
    trendMap.set(row.branchId, current);
  });

  const branches: AnalyticsBranch[] = branchesResult.rows.map(
    (row) => ({
      id: row.id,
      code: row.code,
      country: row.country,
      name: row.name,
      city: row.city,
      region: row.region,
      coordinates:
        row.longitude !== null &&
        row.latitude !== null
          ? [row.longitude, row.latitude]
          : null,
      equipment: row.equipment,
      active: row.active,
      operational: row.operational,
      attention: row.attention,
      offline: row.offline,
      lastSyncLabel: toRelativeLabel(row.lastUpdateAt),
      typeDistribution: typeMap.get(row.id) ?? [],
      conditionDistribution: conditionMap.get(row.id) ?? [],
      trend: trendMap.get(row.id) ?? [],
    }),
  );

  return {
    country,
    branches,
  };
}
