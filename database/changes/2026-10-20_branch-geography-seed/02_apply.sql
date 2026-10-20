-- =========================================================
-- INVENTARIOS TI
-- SEED GEOGRAFICO DE SUCURSALES
-- 02 APPLY
-- =========================================================

BEGIN;

CREATE TEMP TABLE tmp_branch_geography_seed (
    codigo varchar(20) PRIMARY KEY,
    pais_codigo varchar(2) NOT NULL,
    region varchar(120) NOT NULL,
    ciudad varchar(120) NOT NULL,
    latitud double precision,
    longitud double precision,
    precision_ubicacion varchar(20) NOT NULL,
    validada boolean NOT NULL
) ON COMMIT DROP;

INSERT INTO tmp_branch_geography_seed (
    codigo,
    pais_codigo,
    region,
    ciudad,
    latitud,
    longitud,
    precision_ubicacion,
    validada
)
VALUES
('BAQ','CO','Atlántico','Barranquilla',10.9685,-74.8069,'CIUDAD',FALSE),
('BOG','CO','Bogotá, D.C.','Bogotá',4.711,-74.0721,'CIUDAD',FALSE),
('CALI','CO','Valle del Cauca','Cali',3.4516,-76.532,'CIUDAD',FALSE),
('CHIH','MX','Chihuahua','Chihuahua',28.633,-106.0691,'CIUDAD',FALSE),
('CUL','MX','Sinaloa','Culiacán',24.8091,-107.394,'CIUDAD',FALSE),
('CUN','MX','Quintana Roo','Cancún',21.1619,-86.8515,'CIUDAD',FALSE),
('DMAN','MX','Tamaulipas','Ciudad Mante',22.7431,-98.9737,'CIUDAD',FALSE),
('DSAL','MX','Coahuila','Saltillo',25.4232,-101.0053,'CIUDAD',FALSE),
('DSF','MX','Coahuila','Saltillo',25.4232,-101.0053,'CIUDAD',FALSE),
('DTAM','MX','Tamaulipas','Tampico',22.285,-97.875,'CIUDAD',FALSE),
('DTUX','MX','Chiapas','Tuxtla Gutiérrez',16.7516,-93.1167,'CIUDAD',FALSE),
('DURO','MX','Coahuila','Saltillo',NULL,NULL,'CIUDAD',FALSE),
('ESCO','MX','Nuevo León','General Escobedo',25.795,-100.314,'CIUDAD',FALSE),
('GDL','MX','Jalisco','Guadalajara',20.6597,-103.3496,'CIUDAD',FALSE),
('HMO','MX','Sonora','Hermosillo',29.073,-110.9559,'CIUDAD',FALSE),
('KATA','MX','Coahuila','Saltillo',NULL,NULL,'CIUDAD',FALSE),
('KLSC','MX','Coahuila','Saltillo',NULL,NULL,'CIUDAD',FALSE),
('LEON','MX','Guanajuato','León',21.122,-101.682,'CIUDAD',FALSE),
('MEX','MX','Ciudad de México','Ciudad de México',19.4326,-99.1332,'CIUDAD',FALSE),
('MIAT','MX','Tamaulipas','Tampico',22.285,-97.875,'CIUDAD',FALSE),
('MID','MX','Yucatán','Mérida',20.9674,-89.5926,'CIUDAD',FALSE),
('MLMN','MX','Colima','Manzanillo',19.1138,-104.3385,'CIUDAD',FALSE),
('MMAN','MX','Colima','Manzanillo',19.1138,-104.3385,'CIUDAD',FALSE),
('MTAM','MX','Tamaulipas','Tampico',22.285,-97.875,'CIUDAD',FALSE),
('MTY','MX','Nuevo León','Monterrey',25.6866,-100.3161,'CIUDAD',FALSE),
('NSAL','MX','Coahuila','Saltillo',25.4232,-101.0053,'CIUDAD',FALSE),
('NTAM','MX','Tamaulipas','Tampico',22.285,-97.875,'CIUDAD',FALSE),
('OAX','MX','Oaxaca','Oaxaca de Juárez',17.0732,-96.7266,'CIUDAD',FALSE),
('POZR','MX','Veracruz','Poza Rica',20.5332,-97.4595,'CIUDAD',FALSE),
('PUE','MX','Puebla','Puebla',19.0414,-98.2063,'CIUDAD',FALSE),
('QRO','MX','Querétaro','Querétaro',20.5888,-100.3899,'CIUDAD',FALSE),
('SLP','MX','San Luis Potosí','San Luis Potosí',22.1565,-100.9855,'CIUDAD',FALSE),
('TEX','MX','Estado de México','Texcoco',19.5119,-98.8829,'CIUDAD',FALSE),
('TIJ','MX','Baja California','Tijuana',32.5149,-117.0382,'CIUDAD',FALSE),
('TLEO','MX','Guanajuato','León',21.122,-101.682,'CIUDAD',FALSE),
('TOL','MX','Estado de México','Toluca',19.2826,-99.6557,'CIUDAD',FALSE),
('TRC','MX','Coahuila','Torreón',25.5428,-103.4068,'CIUDAD',FALSE),
('TSAL','MX','Coahuila','Saltillo',25.4232,-101.0053,'CIUDAD',FALSE),
('TTAM','MX','Tamaulipas','Tampico',22.285,-97.875,'CIUDAD',FALSE),
('TTUX','MX','Chiapas','Tuxtla Gutiérrez',16.7516,-93.1167,'CIUDAD',FALSE),
('VALL','MX','San Luis Potosí','Ciudad Valles',21.9833,-99.0167,'CIUDAD',FALSE),
('VER','MX','Veracruz','Veracruz',19.1738,-96.1342,'CIUDAD',FALSE),
('VIC','MX','Tamaulipas','Ciudad Victoria',23.7369,-99.1411,'CIUDAD',FALSE),
('VSA','MX','Tabasco','Villahermosa',17.9892,-92.9475,'CIUDAD',FALSE),
('ZAP','MX','Jalisco','Zapopan',20.7211,-103.3918,'CIUDAD',FALSE);

DO $$
DECLARE
    v_seed integer;
    v_encontradas integer;
    v_inactivas integer;
    v_conflictos integer;
BEGIN

    SELECT COUNT(*)
    INTO v_seed
    FROM tmp_branch_geography_seed;

    IF v_seed <> 45 THEN
        RAISE EXCEPTION
            'Migracion detenida: seed con % filas; se esperaban 45.',
            v_seed;
    END IF;


    SELECT COUNT(*)
    INTO v_encontradas
    FROM public.sucursales s
    INNER JOIN tmp_branch_geography_seed seed
        ON seed.codigo = s.codigo;

    IF v_encontradas <> 45 THEN
        RAISE EXCEPTION
            'Migracion detenida: se encontraron % de 45 sucursales.',
            v_encontradas;
    END IF;


    SELECT COUNT(*)
    INTO v_inactivas
    FROM public.sucursales s
    INNER JOIN tmp_branch_geography_seed seed
        ON seed.codigo = s.codigo
    WHERE s.activa = FALSE;

    IF v_inactivas > 0 THEN
        RAISE EXCEPTION
            'Migracion detenida: % sucursales del seed estan inactivas.',
            v_inactivas;
    END IF;


    SELECT COUNT(*)
    INTO v_conflictos
    FROM public.sucursales s
    INNER JOIN tmp_branch_geography_seed seed
        ON seed.codigo = s.codigo
    INNER JOIN public.sucursales_ubicaciones su
        ON su.sucursal_id = s.id
    WHERE su.pais_codigo IS DISTINCT FROM seed.pais_codigo
       OR su.region IS DISTINCT FROM seed.region
       OR su.ciudad IS DISTINCT FROM seed.ciudad
       OR su.latitud IS DISTINCT FROM seed.latitud
       OR su.longitud IS DISTINCT FROM seed.longitud
       OR su.precision_ubicacion IS DISTINCT FROM seed.precision_ubicacion
       OR su.validada IS DISTINCT FROM seed.validada;

    IF v_conflictos > 0 THEN
        RAISE EXCEPTION
            'Migracion detenida: % ubicaciones previas difieren del seed.',
            v_conflictos;
    END IF;

END $$;


INSERT INTO public.sucursales_ubicaciones (
    sucursal_id,
    pais_codigo,
    region,
    ciudad,
    latitud,
    longitud,
    precision_ubicacion,
    validada,
    actualizado_en
)
SELECT
    s.id,
    seed.pais_codigo,
    seed.region,
    seed.ciudad,
    seed.latitud,
    seed.longitud,
    seed.precision_ubicacion,
    seed.validada,
    CURRENT_TIMESTAMP
FROM tmp_branch_geography_seed seed
INNER JOIN public.sucursales s
    ON s.codigo = seed.codigo
ON CONFLICT (sucursal_id)
DO NOTHING;


DO $$
DECLARE
    v_match integer;
BEGIN

    SELECT COUNT(*)
    INTO v_match
    FROM public.sucursales s
    INNER JOIN tmp_branch_geography_seed seed
        ON seed.codigo = s.codigo
    INNER JOIN public.sucursales_ubicaciones su
        ON su.sucursal_id = s.id
    WHERE su.pais_codigo IS NOT DISTINCT FROM seed.pais_codigo
      AND su.region IS NOT DISTINCT FROM seed.region
      AND su.ciudad IS NOT DISTINCT FROM seed.ciudad
      AND su.latitud IS NOT DISTINCT FROM seed.latitud
      AND su.longitud IS NOT DISTINCT FROM seed.longitud
      AND su.precision_ubicacion IS NOT DISTINCT FROM seed.precision_ubicacion
      AND su.validada IS NOT DISTINCT FROM seed.validada;

    IF v_match <> 45 THEN
        RAISE EXCEPTION
            'Migracion detenida: solo % de 45 ubicaciones coinciden.',
            v_match;
    END IF;

END $$;


COMMIT;
