import { pool } from "../db/pool.js";
import type {
  EquipmentAuthUser,
  EquipmentCatalogs,
} from "../types/equipment.js";

export async function getEquipmentCatalogs(
  user: EquipmentAuthUser,
): Promise<EquipmentCatalogs> {
  const superAdmin =
    user.roles.includes("SUPERADMIN");

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
          } as any);

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

    pool.query(
      `
        SELECT
          id,
          numero_factura AS "numeroFactura",
          fecha_factura AS "fechaFactura",
          proveedor_nombre AS "proveedorNombre",
          razon_social AS "razonSocial",
          moneda,
          total
        FROM facturas_compra_ti
        ORDER BY creado_en DESC
        LIMIT 100
      `,
    ),
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
