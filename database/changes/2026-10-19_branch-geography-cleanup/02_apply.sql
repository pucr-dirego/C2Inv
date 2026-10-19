-- =========================================================
-- INVENTARIOS TI
-- NORMALIZACION DE SUCURSALES / GEOGRAFIA
-- 02 APPLY
-- =========================================================

BEGIN;


-- =========================================================
-- GUARDAS
-- =========================================================

DO $$
DECLARE
    v_objetivos integer;
    v_referencias integer;
    v_conflictos_geografia integer;
BEGIN

    SELECT COUNT(*)
    INTO v_objetivos
    FROM public.sucursales
    WHERE codigo IN (
        'CHIT',
        'DURO',
        'HOU',
        'KATA',
        'KLSC',
        'MIA',
        'SAIT'
    );

    IF v_objetivos <> 7 THEN
        RAISE EXCEPTION
            'Migracion detenida: se esperaban 7 sucursales objetivo y se encontraron %.',
            v_objetivos;
    END IF;


    SELECT COUNT(*)
    INTO v_referencias
    FROM public.sucursales s
    WHERE s.codigo IN (
        'CHIT',
        'HOU',
        'MIA',
        'SAIT'
    )
    AND (
        EXISTS (
            SELECT 1
            FROM public.equipos_ti e
            WHERE e.sucursal_id = s.id
        )
        OR EXISTS (
            SELECT 1
            FROM public.usuarios_sucursales us
            WHERE us.sucursal_id = s.id
        )
    );

    IF v_referencias > 0 THEN
        RAISE EXCEPTION
            'Migracion detenida: alguna sucursal a desactivar tiene equipos o usuarios asociados.';
    END IF;


    SELECT COUNT(*)
    INTO v_conflictos_geografia
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
    );

    IF v_conflictos_geografia > 0 THEN
        RAISE EXCEPTION
            'Migracion detenida: existe geografia previa distinta para alguna sucursal de Saltillo.';
    END IF;

END $$;


-- =========================================================
-- DESACTIVAR REGISTROS QUE NO FORMAN PARTE
-- DEL MODELO OPERATIVO DE INVENTARIOS
-- =========================================================

UPDATE public.sucursales
SET activa = FALSE
WHERE codigo IN (
    'CHIT',
    'HOU',
    'MIA',
    'SAIT'
)
AND activa = TRUE;


-- =========================================================
-- COMPLETAR GEOGRAFIA DE LAS UBICACIONES DE SALTILLO
--
-- Si PRODUCCION ya tuviera una fila exactamente correcta,
-- la conservamos completa y no degradamos precision,
-- coordenadas ni estado de validacion.
-- =========================================================

INSERT INTO public.sucursales_ubicaciones (
    sucursal_id,
    pais_codigo,
    region,
    ciudad,
    precision_ubicacion,
    validada,
    actualizado_en
)
SELECT
    s.id,
    'MX',
    'Coahuila',
    'Saltillo',
    'CIUDAD',
    FALSE,
    CURRENT_TIMESTAMP
FROM public.sucursales s
WHERE s.codigo IN (
    'DURO',
    'KATA',
    'KLSC'
)
ON CONFLICT (sucursal_id)
DO NOTHING;


COMMIT;
