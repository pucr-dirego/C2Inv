-- =========================================================
-- INVENTARIOS TI - RELEASE BARRIDO 2A
-- 03 VERIFY - SOLO LECTURA
-- =========================================================

SELECT to_regclass(
  'public.facturas_compra_ti_sucursales'
) AS tabla_facturas_sucursales;

SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'equipos_ti'
  AND (
    indexname ILIKE '%numero_serie%'
    OR indexname ILIKE '%hostname%'
  )
ORDER BY indexname;

SELECT
  COUNT(*)::int AS relaciones_factura_sucursal
FROM public.facturas_compra_ti_sucursales;

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
  COALESCE(cs.total_sucursales, 0) AS total_sucursales
FROM roles_objetivo ro
LEFT JOIN conteo_sucursales cs
  ON cs.usuario_id = ro.usuario_id
WHERE COALESCE(cs.total_sucursales, 0) <> 1;
