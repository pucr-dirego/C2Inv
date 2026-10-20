-- =========================================================
-- INVENTARIOS TI
-- ESQUEMA GEOGRAFICO DE SUCURSALES
-- 02 APPLY
-- =========================================================

BEGIN;


-- =========================================================
-- GUARDA
--
-- Esta migracion se diseño para crear la estructura desde
-- cero. Si la tabla ya existe, no intentamos "arreglarla"
-- silenciosamente.
-- =========================================================

DO $$
BEGIN

    IF to_regclass('public.sucursales') IS NULL THEN
        RAISE EXCEPTION
            'Migracion detenida: public.sucursales no existe.';
    END IF;

    IF to_regclass('public.sucursales_ubicaciones') IS NOT NULL THEN
        RAISE EXCEPTION
            'Migracion detenida: public.sucursales_ubicaciones ya existe. Revisar su estructura antes de continuar.';
    END IF;

END $$;


-- =========================================================
-- TABLA
-- =========================================================

CREATE TABLE public.sucursales_ubicaciones (

    sucursal_id uuid NOT NULL,

    pais_codigo varchar(2) NOT NULL,

    region varchar(120) NOT NULL,

    ciudad varchar(120) NOT NULL,

    latitud double precision,

    longitud double precision,

    precision_ubicacion varchar(20)
        NOT NULL
        DEFAULT 'CIUDAD',

    validada boolean
        NOT NULL
        DEFAULT FALSE,

    actualizado_en timestamptz
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT sucursales_ubicaciones_pkey
        PRIMARY KEY (sucursal_id),


    CONSTRAINT sucursales_ubicaciones_sucursal_id_fkey
        FOREIGN KEY (sucursal_id)
        REFERENCES public.sucursales(id)
        ON DELETE RESTRICT,


    CONSTRAINT sucursales_ubicaciones_pais_codigo_check
        CHECK (
            pais_codigo IN (
                'MX',
                'CO',
                'US'
            )
        ),


    CONSTRAINT sucursales_ubicaciones_precision_ubicacion_check
        CHECK (
            precision_ubicacion IN (
                'CIUDAD',
                'DIRECCION'
            )
        ),


    CONSTRAINT chk_sucursal_ubicacion_coordenadas
        CHECK (
            (
                latitud IS NULL
                AND longitud IS NULL
            )
            OR
            (
                latitud IS NOT NULL
                AND longitud IS NOT NULL
                AND latitud >= -90
                AND latitud <= 90
                AND longitud >= -180
                AND longitud <= 180
            )
        )
);


-- =========================================================
-- INDICE PARA REPORTES / ANALYTICS
-- =========================================================

CREATE INDEX idx_sucursales_ubicaciones_pais_region
    ON public.sucursales_ubicaciones (
        pais_codigo,
        region
    );


COMMIT;
