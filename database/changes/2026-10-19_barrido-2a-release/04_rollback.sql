-- =========================================================
-- INVENTARIOS TI - RELEASE BARRIDO 2A
-- 04 ROLLBACK
-- =========================================================
--
-- No se recomienda revertir automaticamente la BD de este release.
-- Los cambios son compatibles hacia atras:
--   1) La tabla facturas_compra_ti_sucursales es aditiva.
--   2) El indice global de serial es mas estricto, pero no cambia datos.
--
-- Si fuera necesario volver al codigo anterior, se puede hacer rollback
-- del backend/frontend y CONSERVAR estos cambios de BD.
--
-- No se incluye DROP TABLE ni relajacion automatica del indice porque,
-- despues de poner la version nueva en servicio, la tabla puede contener
-- relaciones nuevas que no deben perderse.
-- =========================================================

SELECT
  'Rollback de aplicacion compatible; no requiere rollback de BD.'
    AS instruccion;
