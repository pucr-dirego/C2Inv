-- =========================================================
-- INVENTARIOS TI
-- SEED GEOGRAFICO DE SUCURSALES
-- 03 VERIFY - SOLO LECTURA
-- =========================================================

SELECT
    COUNT(*)::int AS total_ubicaciones
FROM public.sucursales_ubicaciones;


SELECT
    pais_codigo,
    COUNT(*)::int AS total
FROM public.sucursales_ubicaciones
GROUP BY pais_codigo
ORDER BY pais_codigo;


-- Antes del cleanup deben quedar exactamente
-- CHIT, HOU, MIA y SAIT activas sin geografia.
SELECT
    s.codigo,
    s.nombre
FROM public.sucursales s
LEFT JOIN public.sucursales_ubicaciones su
    ON su.sucursal_id = s.id
WHERE s.activa = TRUE
  AND su.sucursal_id IS NULL
ORDER BY s.codigo;


SELECT
    s.codigo,
    s.nombre,
    su.pais_codigo,
    su.region,
    su.ciudad,
    su.latitud,
    su.longitud,
    su.precision_ubicacion,
    su.validada
FROM public.sucursales s
INNER JOIN public.sucursales_ubicaciones su
    ON su.sucursal_id = s.id
ORDER BY s.codigo;
