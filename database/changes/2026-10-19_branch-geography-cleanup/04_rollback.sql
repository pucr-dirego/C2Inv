-- =========================================================
-- INVENTARIOS TI
-- NORMALIZACION DE SUCURSALES / GEOGRAFIA
-- 04 ROLLBACK
-- =========================================================
--
-- No se realiza rollback automatico de datos.
--
-- Motivo:
-- una vez desplegado el release podrían existir nuevas
-- referencias o decisiones operativas sobre estas sucursales.
--
-- Si fuera necesario regresar al estado previo completo,
-- utilizar el dump de PostgreSQL tomado inmediatamente antes
-- del release.
-- =========================================================

SELECT
    'No ejecutar rollback automatico. Utilizar backup pre-release si fuera necesario.'
    AS instruccion;
