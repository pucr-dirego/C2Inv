
import { pool } from "../db/pool.js";
import type {
  EquipmentAuthUser,
  EquipmentCatalogs,
} from "../types/equipment.js";

type InvoiceCatalogRow = {
  id: string;
  numeroFactura: string | null;
  fechaFactura: string | null;
  proveedorNombre: string | null;
  razonSocial: string | null;
  moneda: string;
  total: string | number | null;
};

export async function getEquipmentCatalogs(
  user: EquipmentAuthUser,
): Promise<EquipmentCatalogs> {
  const superAdmin =
    user.roles.includes("SUPERADMIN");

  // Incluye asignaciones históricas/inactivas para decidir alcance
  // de lectura. Las sucursales disponibles para NUEVAS capturas
  // siguen filtrándose por activa = TRUE.
  const branchIds =
    user.sucursales.map(
      (branch) => branch.id,
    );

  const branchesPromise =
    superAdmin
      ? pool.query(
          `
            SELECT id, codigo, nombre
            FROM sucursales
            WHERE activa = TRUE
            ORDER BY nombre
          `,
        )
      : branchIds.length
        ? pool.query(
            `
              SELECT id, codigo, nombre
              FROM sucursales
              WHERE activa = TRUE
                AND id = ANY($1::uuid[])
              ORDER BY nombre
            `,
            [branchIds],
          )
        : Promise.resolve({
            rows: [],
          });

  const invoicesPromise =
    superAdmin
      ? pool.query<InvoiceCatalogRow>(
          `
            SELECT
              f.id,
              f.numero_factura AS "numeroFactura",
              f.fecha_factura AS "fechaFactura",
              f.proveedor_nombre AS "proveedorNombre",
              f.razon_social AS "razonSocial",
              f.moneda,
              f.total
            FROM facturas_compra_ti f
            ORDER BY f.creado_en DESC
            LIMIT 100
          `,
        )
      : branchIds.length
        ? pool.query<InvoiceCatalogRow>(
            `
              SELECT
                f.id,
                f.numero_factura AS "numeroFactura",
                f.fecha_factura AS "fechaFactura",
                f.proveedor_nombre AS "proveedorNombre",
                f.razon_social AS "razonSocial",
                f.moneda,
                f.total
              FROM facturas_compra_ti f
              WHERE EXISTS (
                SELECT 1
                FROM facturas_compra_ti_sucursales fs
                WHERE fs.factura_id = f.id
                  AND fs.sucursal_id = ANY($1::uuid[])
              )
              ORDER BY f.creado_en DESC
              LIMIT 100
            `,
            [branchIds],
          )
        : Promise.resolve({
            rows: [] as InvoiceCatalogRow[],
          });

  const [
    sucursales,
    departamentos,
    tiposEquipo,
    estadosFuncionamiento,
    condicionesFisicas,
    tiposIncorporacion,
    facturasCompra,
  ] = await Promise.all([
    branchesPromise,

    pool.query(
      `
        SELECT id, codigo, nombre, descripcion
        FROM departamentos
        WHERE activo = TRUE
        ORDER BY orden, nombre
      `,
    ),

    pool.query(
      `
        SELECT id, codigo, nombre, descripcion
        FROM tipos_equipo
        WHERE activo = TRUE
        ORDER BY orden, nombre
      `,
    ),

    pool.query(
      `
        SELECT id, codigo, nombre, descripcion
        FROM estados_funcionamiento
        WHERE activo = TRUE
        ORDER BY orden, nombre
      `,
    ),

    pool.query(
      `
        SELECT id, codigo, nombre, descripcion
        FROM condiciones_fisicas
        WHERE activo = TRUE
        ORDER BY orden, nombre
      `,
    ),

    pool.query(
      `
        SELECT id, codigo, nombre, descripcion
        FROM tipos_incorporacion
        WHERE activo = TRUE
        ORDER BY orden, nombre
      `,
    ),

    invoicesPromise,
  ]);

  return {
    sucursales: sucursales.rows,
    departamentos: departamentos.rows,
    tiposEquipo: tiposEquipo.rows,
    estadosFuncionamiento:
      estadosFuncionamiento.rows,
    condicionesFisicas:
      condicionesFisicas.rows,
    tiposIncorporacion:
      tiposIncorporacion.rows,
    facturasCompra:
      facturasCompra.rows.map(
        (row) => ({
          ...row,
          total:
            row.total == null
              ? null
              : Number(row.total),
        }),
      ),
  };
}
