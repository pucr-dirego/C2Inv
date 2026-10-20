-- =========================================================
-- INVENTARIOS TI
-- ESQUEMA GEOGRAFICO DE SUCURSALES
-- 01 PRECHECK - SOLO LECTURA
-- =========================================================

SELECT
    to_regclass('public.sucursales') AS tabla_sucursales,
    to_regclass('public.sucursales_ubicaciones') AS tabla_sucursales_ubicaciones;


-- La tabla base debe existir.
DO $$
BEGIN
    IF to_regclass('public.sucursales') IS NULL THEN
        RAISE EXCEPTION
            'Precheck detenido: public.sucursales no existe.';
    END IF;
END $$;


-- Informativo:
-- si devuelve NULL, es exactamente el escenario esperado
-- para esta migracion.
SELECT
    to_regclass('public.sucursales_ubicaciones')
        AS estructura_geografica_actual;
