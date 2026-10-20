-- =========================================================
-- INVENTARIOS TI
-- HOTFIX ANALITICA / REPORTES
-- 02 APPLY
-- =========================================================

BEGIN;

DO $$
DECLARE
    v_objetivos integer;
    v_referencias_klsc integer;
    v_conflictos_geografia integer;
BEGIN
    SELECT COUNT(*)::int
    INTO v_objetivos
    FROM public.sucursales
    WHERE codigo IN ('DURO', 'KATA', 'KLSC');

    IF v_objetivos <> 3 THEN
        RAISE EXCEPTION
            'Hotfix detenido: se esperaban 3 sucursales objetivo y se encontraron %.',
            v_objetivos;
    END IF;

    SELECT COUNT(*)::int
    INTO v_referencias_klsc
    FROM public.sucursales s
    WHERE s.codigo = 'KLSC'
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
          OR EXISTS (
              SELECT 1
              FROM public.facturas_compra_ti_sucursales fs
              WHERE fs.sucursal_id = s.id
          )
      );

    IF v_referencias_klsc > 0 THEN
        RAISE EXCEPTION
            'Hotfix detenido: KLSC ya tiene equipos, usuarios o facturas asociadas.';
    END IF;

    SELECT COUNT(*)::int
    INTO v_conflictos_geografia
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
      );

    IF v_conflictos_geografia > 0 THEN
        RAISE EXCEPTION
            'Hotfix detenido: DURO/KATA tienen geografia o coordenadas previas que requieren revision.';
    END IF;
END $$;

-- KLSC se conserva como registro disponible para una futura
-- reactivacion, pero deja de participar en la operacion normal.
UPDATE public.sucursales
SET activa = FALSE
WHERE codigo = 'KLSC'
  AND activa = TRUE;

-- Coordenada representativa de Saltillo a precision CIUDAD.
-- Solo se completa cuando DURO/KATA no tenian coordenadas previas.
UPDATE public.sucursales_ubicaciones su
SET
    latitud = 25.4232,
    longitud = -101.0053,
    precision_ubicacion = 'CIUDAD',
    actualizado_en = CURRENT_TIMESTAMP
FROM public.sucursales s
WHERE s.id = su.sucursal_id
  AND s.codigo IN ('DURO', 'KATA')
  AND su.pais_codigo = 'MX'
  AND su.region = 'Coahuila'
  AND su.ciudad = 'Saltillo'
  AND su.latitud IS NULL
  AND su.longitud IS NULL;

COMMIT;
