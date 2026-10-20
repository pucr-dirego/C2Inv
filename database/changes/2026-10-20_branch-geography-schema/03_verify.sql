-- =========================================================
-- INVENTARIOS TI
-- ESQUEMA GEOGRAFICO DE SUCURSALES
-- 03 VERIFY - SOLO LECTURA
-- =========================================================

SELECT
    to_regclass('public.sucursales_ubicaciones')
        AS tabla_sucursales_ubicaciones;


SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'sucursales_ubicaciones'
ORDER BY ordinal_position;


SELECT
    con.conname AS constraint_name,
    con.contype AS tipo,
    pg_get_constraintdef(con.oid, true) AS definicion
FROM pg_constraint con
INNER JOIN pg_class rel
    ON rel.oid = con.conrelid
INNER JOIN pg_namespace nsp
    ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = 'public'
  AND rel.relname = 'sucursales_ubicaciones'
ORDER BY con.conname;


SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'sucursales_ubicaciones'
ORDER BY indexname;
