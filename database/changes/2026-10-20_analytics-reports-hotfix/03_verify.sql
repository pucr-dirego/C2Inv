-- =========================================================
-- INVENTARIOS TI
-- HOTFIX ANALITICA / REPORTES
-- 03 VERIFY - SOLO LECTURA
-- =========================================================

-- Estado esperado:
--   DURO: activa, MX/Coahuila/Saltillo, 25.4232/-101.0053
--   KATA: activa, MX/Coahuila/Saltillo, 25.4232/-101.0053
--   KLSC: inactiva, conserva su geografia
SELECT
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

-- Debe devolver 0 filas: ninguna sucursal activa soportada por
-- Reportes debe quedar sin pais/region/ciudad.
SELECT
    s.codigo,
    s.nombre,
    su.pais_codigo,
    su.region,
    su.ciudad
FROM public.sucursales s
LEFT JOIN public.sucursales_ubicaciones su
    ON su.sucursal_id = s.id
WHERE s.activa = TRUE
  AND (
      su.sucursal_id IS NULL
      OR su.pais_codigo IS NULL
      OR TRIM(su.pais_codigo) = ''
      OR su.pais_codigo NOT IN ('MX', 'CO')
      OR su.region IS NULL
      OR TRIM(su.region) = ''
      OR su.ciudad IS NULL
      OR TRIM(su.ciudad) = ''
  )
ORDER BY s.nombre;

-- Inventario activo por pais. Los equipos se cuentan por pertenencia
-- territorial, independientemente de si hubiera coordenadas de mapa.
SELECT
    su.pais_codigo,
    COUNT(e.id)::int AS equipos_activos
FROM public.equipos_ti e
INNER JOIN public.sucursales s
    ON s.id = e.sucursal_id
INNER JOIN public.sucursales_ubicaciones su
    ON su.sucursal_id = s.id
WHERE e.activo = TRUE
  AND s.activa = TRUE
GROUP BY su.pais_codigo
ORDER BY su.pais_codigo;

-- Sucursales activas por pais y cobertura cartografica.
SELECT
    su.pais_codigo,
    COUNT(*)::int AS sucursales_activas,
    COUNT(*) FILTER (
        WHERE su.latitud IS NOT NULL
          AND su.longitud IS NOT NULL
    )::int AS sucursales_con_coordenadas
FROM public.sucursales s
INNER JOIN public.sucursales_ubicaciones su
    ON su.sucursal_id = s.id
WHERE s.activa = TRUE
GROUP BY su.pais_codigo
ORDER BY su.pais_codigo;
