-- =========================================================
-- INVENTARIOS TI - RELEASE BARRIDO 2A
-- 02 APPLY
-- Promueve a PRODUCCION los cambios de BD pendientes del Barrido 1.
-- El Barrido 2A no necesita nuevas columnas/tablas.
-- =========================================================

BEGIN;

-- Relacion N:M factura <-> sucursal.
CREATE TABLE IF NOT EXISTS public.facturas_compra_ti_sucursales (
  factura_id uuid NOT NULL,
  sucursal_id uuid NOT NULL,
  asignada_en timestamptz NOT NULL DEFAULT NOW(),
  asignada_por uuid,
  CONSTRAINT facturas_compra_ti_sucursales_pkey
    PRIMARY KEY (factura_id, sucursal_id),
  CONSTRAINT fk_facturas_sucursales_factura
    FOREIGN KEY (factura_id)
    REFERENCES public.facturas_compra_ti(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_facturas_sucursales_sucursal
    FOREIGN KEY (sucursal_id)
    REFERENCES public.sucursales(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_facturas_sucursales_actor
    FOREIGN KEY (asignada_por)
    REFERENCES public.usuarios(id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_facturas_sucursales_sucursal
  ON public.facturas_compra_ti_sucursales (
    sucursal_id,
    factura_id
  );

-- Backfill seguro para instalaciones que ya tengan facturas asociadas.
INSERT INTO public.facturas_compra_ti_sucursales (
  factura_id,
  sucursal_id,
  asignada_en,
  asignada_por
)
SELECT DISTINCT
  e.factura_compra_id,
  e.sucursal_id,
  NOW(),
  NULL::uuid
FROM public.equipos_ti e
WHERE e.factura_compra_id IS NOT NULL
ON CONFLICT (factura_id, sucursal_id) DO NOTHING;

-- El serial identifica fisicamente al hardware y debe ser unico
-- historicamente, incluso cuando el equipo esta dado de baja.
DROP INDEX IF EXISTS public.ux_equipos_ti_numero_serie_activo;

CREATE UNIQUE INDEX IF NOT EXISTS ux_equipos_ti_numero_serie
  ON public.equipos_ti (
    LOWER(numero_serie)
  );

COMMIT;
