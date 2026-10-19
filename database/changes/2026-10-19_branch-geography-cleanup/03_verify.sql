-- =========================================================
-- INVENTARIOS TI
-- NORMALIZACION DE SUCURSALES / GEOGRAFIA
-- 03 VERIFY - SOLO LECTURA
-- =========================================================

-- Estado final de las 7 sucursales.
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


-- Debe devolver 0 filas.
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


-- Conteo final.
SELECT
    activa,
    COUNT(*)::int AS total
FROM public.sucursales
GROUP BY activa
ORDER BY activa DESC;
