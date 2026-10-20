-- =========================================================
-- INVENTARIOS TI
-- HOTFIX ANALITICA / REPORTES
-- 04 ROLLBACK
-- =========================================================
-- No se ejecuta rollback automatico de datos.
--
-- Motivo:
-- despues del despliegue KLSC podria recibir una decision operativa
-- nueva y DURO/KATA podrian adquirir coordenadas mas precisas. Un
-- rollback ciego podria sobrescribir informacion valida posterior.
--
-- Si el hotfix debe revertirse inmediatamente, usar el backup
-- pre-release o realizar una reversa manual tras verificar que no
-- existen cambios posteriores.
-- =========================================================

SELECT
    'Rollback automatico deshabilitado. Verificar cambios posteriores y usar backup pre-release si fuera necesario.'
    AS instruccion;
