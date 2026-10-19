-- =========================================================
-- INVENTARIOS TI
-- NORMALIZACION DE SUCURSALES / GEOGRAFIA
-- 01 PRECHECK - SOLO LECTURA
-- =========================================================

-- Deben existir exactamente las 7 sucursales objetivo.
SELECT
    s.id,
    s.codigo,
    s.nombre,
    s.activa,
    su.pais_codigo,
    su.region,
    su.ciudad,
    su.precision_ubicacion,
    su.validada
FROM public.sucursales s
LEFT JOIN public.sucursales_ubicaciones su
    ON su.sucursal_id = s.id
WHERE s.codigo IN (
    'CHIT',
    'DURO',
    'HOU',
    'KATA',
    'KLSC',
    'MIA',
    'SAIT'
)
ORDER BY s.codigo;


-- Las cuatro sucursales a desactivar deben tener
-- 0 equipos y 0 usuarios asociados.
SELECT
    s.codigo,
    s.nombre,
    s.activa,
    COUNT(DISTINCT e.id)::int AS equipos,
    COUNT(DISTINCT us.usuario_id)::int AS usuarios_asignados
FROM public.sucursales s
LEFT JOIN public.equipos_ti e
    ON e.sucursal_id = s.id
LEFT JOIN public.usuarios_sucursales us
    ON us.sucursal_id = s.id
WHERE s.codigo IN (
    'CHIT',
    'HOU',
    'MIA',
    'SAIT'
)
GROUP BY
    s.id,
    s.codigo,
    s.nombre,
    s.activa
ORDER BY s.codigo;


-- Si alguna de las 3 sucursales de Saltillo ya tiene
-- una geografia diferente, debe revisarse antes del APPLY.
SELECT
    s.codigo,
    s.nombre,
    su.pais_codigo,
    su.region,
    su.ciudad,
    su.precision_ubicacion,
    su.validada
FROM public.sucursales s
INNER JOIN public.sucursales_ubicaciones su
    ON su.sucursal_id = s.id
WHERE s.codigo IN (
    'DURO',
    'KATA',
    'KLSC'
)
AND (
    su.pais_codigo <> 'MX'
    OR su.region <> 'Coahuila'
    OR su.ciudad <> 'Saltillo'
)
ORDER BY s.codigo;


-- Informativo:
-- sucursales activas con geografia incompleta.
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
