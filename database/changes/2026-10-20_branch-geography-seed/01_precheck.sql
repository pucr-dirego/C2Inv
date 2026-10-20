-- =========================================================
-- INVENTARIOS TI
-- SEED GEOGRAFICO DE SUCURSALES
-- 01 PRECHECK - SOLO LECTURA
-- =========================================================

SELECT
    to_regclass('public.sucursales') AS tabla_sucursales,
    to_regclass('public.sucursales_ubicaciones') AS tabla_sucursales_ubicaciones;

-- Deben existir las 45 sucursales del seed.
SELECT COUNT(*)::int AS sucursales_seed_encontradas
FROM public.sucursales
WHERE codigo IN (
    'BAQ','BOG','CALI','CHIH','CUL','CUN','DMAN','DSAL','DSF','DTAM',
    'DTUX','DURO','ESCO','GDL','HMO','KATA','KLSC','LEON','MEX','MIAT',
    'MID','MLMN','MMAN','MTAM','MTY','NSAL','NTAM','OAX','POZR','PUE',
    'QRO','SLP','TEX','TIJ','TLEO','TOL','TRC','TSAL','TTAM','TTUX',
    'VALL','VER','VIC','VSA','ZAP'
);

-- Debe devolver 0 filas.
SELECT codigo, nombre, activa
FROM public.sucursales
WHERE codigo IN (
    'BAQ','BOG','CALI','CHIH','CUL','CUN','DMAN','DSAL','DSF','DTAM',
    'DTUX','DURO','ESCO','GDL','HMO','KATA','KLSC','LEON','MEX','MIAT',
    'MID','MLMN','MMAN','MTAM','MTY','NSAL','NTAM','OAX','POZR','PUE',
    'QRO','SLP','TEX','TIJ','TLEO','TOL','TRC','TSAL','TTAM','TTUX',
    'VALL','VER','VIC','VSA','ZAP'
)
AND activa = FALSE
ORDER BY codigo;

SELECT COUNT(*)::int AS ubicaciones_actuales
FROM public.sucursales_ubicaciones;

SELECT s.codigo, s.nombre
FROM public.sucursales s
LEFT JOIN public.sucursales_ubicaciones su
    ON su.sucursal_id = s.id
WHERE s.activa = TRUE
  AND su.sucursal_id IS NULL
ORDER BY s.codigo;
