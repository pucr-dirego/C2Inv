-- =========================================================
-- INVENTARIOS TI
-- HOTFIX ANALITICA / REPORTES
-- 01 PRECHECK - SOLO LECTURA
-- =========================================================
-- Objetivos:
--   1) KLSC se conservara, pero quedara inactiva.
--   2) DURO y KATA conservaran su geografia territorial de
--      Saltillo y recibiran coordenadas de precision CIUDAD.
--   3) No se modifica ni elimina historial.
-- =========================================================

-- Deben existir exactamente los tres codigos objetivo.
SELECT
    s.id,
    s.codigo,
    s.nombre,
    s.activa,
    su.pais_codigo,
    su.region,
    su.ciudad,
    su.latitud,
    su.longitud,
    su.precision_ubicacion,
    su.validada
FROM public.sucursales s
LEFT JOIN public.sucursales_ubicaciones su
    ON su.sucursal_id = s.id
WHERE s.codigo IN ('DURO', 'KATA', 'KLSC')
ORDER BY s.codigo;

-- KLSC debe estar libre de dependencias operativas antes de
-- desactivarla dentro de este hotfix.
SELECT
    s.codigo,
    s.nombre,
    s.activa,
    COUNT(DISTINCT e.id)::int AS equipos_totales,
    COUNT(DISTINCT e.id) FILTER (WHERE e.activo = TRUE)::int AS equipos_activos,
    COUNT(DISTINCT us.usuario_id)::int AS usuarios_asignados,
    COUNT(DISTINCT fs.factura_id)::int AS facturas_asociadas
FROM public.sucursales s
LEFT JOIN public.equipos_ti e
    ON e.sucursal_id = s.id
LEFT JOIN public.usuarios_sucursales us
    ON us.sucursal_id = s.id
LEFT JOIN public.facturas_compra_ti_sucursales fs
    ON fs.sucursal_id = s.id
WHERE s.codigo = 'KLSC'
GROUP BY s.id, s.codigo, s.nombre, s.activa;

-- Informativo: equipos activos que actualmente pertenecen a
-- DURO/KATA/KLSC. En PROD validamos 14 + 18 + 0 = 32.
SELECT
    s.codigo,
    s.nombre,
    COUNT(e.id)::int AS equipos_activos
FROM public.sucursales s
LEFT JOIN public.equipos_ti e
    ON e.sucursal_id = s.id
   AND e.activo = TRUE
WHERE s.codigo IN ('DURO', 'KATA', 'KLSC')
GROUP BY s.id, s.codigo, s.nombre
ORDER BY s.codigo;

-- Debe devolver 0 filas. Si devuelve algo, NO ejecutar 02_apply:
-- DURO/KATA tienen una geografia diferente a la acordada o unas
-- coordenadas previas distintas que deben revisarse manualmente.
SELECT
    s.codigo,
    s.nombre,
    su.pais_codigo,
    su.region,
    su.ciudad,
    su.latitud,
    su.longitud
FROM public.sucursales s
LEFT JOIN public.sucursales_ubicaciones su
    ON su.sucursal_id = s.id
WHERE s.codigo IN ('DURO', 'KATA')
  AND (
      su.sucursal_id IS NULL
      OR su.pais_codigo <> 'MX'
      OR su.region <> 'Coahuila'
      OR su.ciudad <> 'Saltillo'
      OR (su.latitud IS NULL) <> (su.longitud IS NULL)
      OR (
          su.latitud IS NOT NULL
          AND (
              su.latitud <> 25.4232
              OR su.longitud <> -101.0053
          )
      )
  )
ORDER BY s.codigo;
