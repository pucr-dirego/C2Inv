-- =========================================================
-- INVENTARIOS TI
-- ESQUEMA GEOGRAFICO DE SUCURSALES
-- 04 ROLLBACK
-- =========================================================
--
-- Ejecutar solo si 02_apply.sql fue aplicado pero TODAVIA
-- no se han insertado ubicaciones.
-- =========================================================

DO $$
DECLARE
    v_registros bigint;
BEGIN

    IF to_regclass('public.sucursales_ubicaciones') IS NULL THEN
        RETURN;
    END IF;

    SELECT COUNT(*)
    INTO v_registros
    FROM public.sucursales_ubicaciones;

    IF v_registros > 0 THEN
        RAISE EXCEPTION
            'Rollback detenido: sucursales_ubicaciones contiene % registros.',
            v_registros;
    END IF;

END $$;


DROP TABLE IF EXISTS public.sucursales_ubicaciones;
