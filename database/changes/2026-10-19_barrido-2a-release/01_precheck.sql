-- =========================================================
-- INVENTARIOS TI - RELEASE BARRIDO 2A
-- 01 PRECHECK - SOLO LECTURA
-- Ejecutar en PRODUCCION antes de 02_apply.sql.
-- =========================================================

-- 1) La tabla factura <-> sucursal puede existir o no.
SELECT to_regclass(
  'public.facturas_compra_ti_sucursales'
) AS tabla_facturas_sucursales;

-- 2) No debe existir ningun serial duplicado historicamente.
SELECT
  LOWER(TRIM(numero_serie)) AS numero_serie_normalizado,
  COUNT(*)::int AS total
FROM public.equipos_ti
WHERE numero_serie IS NOT NULL
  AND TRIM(numero_serie) <> ''
GROUP BY LOWER(TRIM(numero_serie))
HAVING COUNT(*) > 1
ORDER BY total DESC, numero_serie_normalizado;

-- 3) Hostname entre equipos activos debe seguir sin duplicados.
SELECT
  LOWER(TRIM(hostname)) AS hostname_normalizado,
  COUNT(*)::int AS total
FROM public.equipos_ti
WHERE activo = TRUE
  AND hostname IS NOT NULL
  AND TRIM(hostname) <> ''
GROUP BY LOWER(TRIM(hostname))
HAVING COUNT(*) > 1
ORDER BY total DESC, hostname_normalizado;

-- 4) Detecta GERENTE / USUARIO que no tengan exactamente una sucursal.
WITH roles_objetivo AS (
  SELECT
    ur.usuario_id,
    r.codigo AS rol
  FROM public.usuarios_roles ur
  INNER JOIN public.roles r
    ON r.id = ur.rol_id
  WHERE r.codigo IN ('GERENTE', 'USUARIO')
),
conteo_sucursales AS (
  SELECT
    usuario_id,
    COUNT(DISTINCT sucursal_id)::int AS total_sucursales
  FROM public.usuarios_sucursales
  GROUP BY usuario_id
)
SELECT
  ro.usuario_id,
  ro.rol,
  u.estado,
  COALESCE(cs.total_sucursales, 0) AS total_sucursales
FROM roles_objetivo ro
INNER JOIN public.usuarios u
  ON u.id = ro.usuario_id
LEFT JOIN conteo_sucursales cs
  ON cs.usuario_id = ro.usuario_id
WHERE COALESCE(cs.total_sucursales, 0) <> 1
ORDER BY ro.rol, ro.usuario_id;

-- 5) Catálogos inactivos que siguen referenciados por equipos.
-- No bloquea el release: el Barrido 2A permite conservar el valor actual.
SELECT
  'tipo_equipo' AS catalogo,
  te.codigo,
  te.nombre,
  COUNT(e.id)::int AS equipos_referenciando
FROM public.tipos_equipo te
INNER JOIN public.equipos_ti e
  ON e.tipo_equipo_id = te.id
WHERE te.activo = FALSE
GROUP BY te.id, te.codigo, te.nombre

UNION ALL

SELECT
  'departamento',
  d.codigo,
  d.nombre,
  COUNT(e.id)::int
FROM public.departamentos d
INNER JOIN public.equipos_ti e
  ON e.departamento_id = d.id
WHERE d.activo = FALSE
GROUP BY d.id, d.codigo, d.nombre

UNION ALL

SELECT
  'estado_funcionamiento',
  ef.codigo,
  ef.nombre,
  COUNT(e.id)::int
FROM public.estados_funcionamiento ef
INNER JOIN public.equipos_ti e
  ON e.estado_funcionamiento_id = ef.id
WHERE ef.activo = FALSE
GROUP BY ef.id, ef.codigo, ef.nombre

UNION ALL

SELECT
  'condicion_fisica',
  cf.codigo,
  cf.nombre,
  COUNT(e.id)::int
FROM public.condiciones_fisicas cf
INNER JOIN public.equipos_ti e
  ON e.condicion_fisica_id = cf.id
WHERE cf.activo = FALSE
GROUP BY cf.id, cf.codigo, cf.nombre

UNION ALL

SELECT
  'tipo_incorporacion',
  ti.codigo,
  ti.nombre,
  COUNT(e.id)::int
FROM public.tipos_incorporacion ti
INNER JOIN public.equipos_ti e
  ON e.tipo_incorporacion_id = ti.id
WHERE ti.activo = FALSE
GROUP BY ti.id, ti.codigo, ti.nombre
ORDER BY catalogo, nombre;
