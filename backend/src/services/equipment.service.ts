import { pool } from "../db/pool.js";
import type {
  EquipmentAuthUser,
  EquipmentInput,
  EquipmentUpdateInput,
} from "../types/equipment.js";

export class EquipmentServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "EquipmentServiceError";
  }
}

function isManager(user: EquipmentAuthUser) {
  return (
    user.roles.includes("SUPERADMIN") ||
    user.roles.includes("GERENTE")
  );
}

function canAccessBranch(
  user: EquipmentAuthUser,
  branchId: string,
) {
  return (
    user.roles.includes("SUPERADMIN") ||
    user.sucursales.some(
      (branch) => branch.id === branchId,
    )
  );
}

type EquipmentCatalogTable =
  | "tipos_equipo"
  | "departamentos"
  | "estados_funcionamiento"
  | "condiciones_fisicas"
  | "tipos_incorporacion"
  | "motivos_baja_equipo";

type CatalogRecord = {
  id: string;
  codigo: string;
  activo: boolean;
};

type CurrentCatalogSelection = {
  tipo_equipo_id: string;
  departamento_id: string;
  estado_funcionamiento_id: string;
  condicion_fisica_id: string;
  tipo_incorporacion_id: string;
};

async function resolveCatalogSelection(
  table: EquipmentCatalogTable,
  id: string,
  label: string,
  currentId?: string,
): Promise<CatalogRecord> {
  // `table` nunca viene del request: solo puede ser uno de los
  // identificadores definidos en EquipmentCatalogTable.
  const result = await pool.query<CatalogRecord>(
    `
      SELECT id, codigo, activo
      FROM ${table}
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  const item = result.rows[0];

  if (!item) {
    throw new EquipmentServiceError(
      "CATALOG_NOT_FOUND",
      `La opción seleccionada para ${label} no existe.`,
    );
  }

  if (
    !item.activo &&
    item.id !== currentId
  ) {
    throw new EquipmentServiceError(
      "CATALOG_INACTIVE",
      `La opción seleccionada para ${label} está inactiva y no puede asignarse.`,
    );
  }

  return item;
}

async function validateEquipmentCatalogs(
  input: EquipmentInput,
  current?: CurrentCatalogSelection,
) {
  const [
    equipmentType,
  ] = await Promise.all([
    resolveCatalogSelection(
      "tipos_equipo",
      input.tipoEquipoId,
      "tipo de equipo",
      current?.tipo_equipo_id,
    ),
    resolveCatalogSelection(
      "departamentos",
      input.departamentoId,
      "departamento",
      current?.departamento_id,
    ),
    resolveCatalogSelection(
      "estados_funcionamiento",
      input.estadoFuncionamientoId,
      "estado de funcionamiento",
      current?.estado_funcionamiento_id,
    ),
    resolveCatalogSelection(
      "condiciones_fisicas",
      input.condicionFisicaId,
      "condición física",
      current?.condicion_fisica_id,
    ),
    resolveCatalogSelection(
      "tipos_incorporacion",
      input.tipoIncorporacionId,
      "tipo de incorporación",
      current?.tipo_incorporacion_id,
    ),
  ]);

  return {
    typeCode: equipmentType.codigo,
  };
}

function normalizeOptional(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

async function ensureBranchAccess(
  user: EquipmentAuthUser,
  branchId: string,
) {
  if (!canAccessBranch(user, branchId)) {
    throw new EquipmentServiceError(
      "BRANCH_NOT_ALLOWED",
      "No tienes acceso a la sucursal seleccionada.",
    );
  }
}


async function ensureBranchActive(
  branchId: string,
) {
  const result = await pool.query<{
    activa: boolean;
  }>(
    `
      SELECT activa
      FROM sucursales
      WHERE id = $1
      LIMIT 1
    `,
    [branchId],
  );

  const branch = result.rows[0];

  if (!branch) {
    throw new EquipmentServiceError(
      "BRANCH_NOT_FOUND",
      "La sucursal seleccionada no existe.",
    );
  }

  if (!branch.activa) {
    throw new EquipmentServiceError(
      "BRANCH_INACTIVE",
      "La sucursal está inactiva y no acepta nuevas operaciones de inventario.",
    );
  }
}

async function validateUniqueFields(
  serial: string,
  hostname: string | null,
  excludeId?: string,
) {
  const serialResult = await pool.query(
    `
      SELECT id
      FROM equipos_ti
      WHERE LOWER(numero_serie) = LOWER($1)
        AND ($2::uuid IS NULL OR id <> $2::uuid)
      LIMIT 1
    `,
    [serial, excludeId ?? null],
  );

  if ((serialResult.rowCount ?? 0) > 0) {
    throw new EquipmentServiceError(
      "SERIAL_IN_USE",
      "Ya existe un equipo con ese número de serie, aunque esté dado de baja.",
    );
  }

  if (hostname) {
    const hostnameResult = await pool.query(
      `
        SELECT id
        FROM equipos_ti
        WHERE activo = TRUE
          AND LOWER(hostname) = LOWER($1)
          AND ($2::uuid IS NULL OR id <> $2::uuid)
        LIMIT 1
      `,
      [hostname, excludeId ?? null],
    );

    if ((hostnameResult.rowCount ?? 0) > 0) {
      throw new EquipmentServiceError(
        "HOSTNAME_IN_USE",
        "Ya existe un equipo activo con ese hostname.",
      );
    }
  }
}

async function linkInvoiceToBranch(
  client: import("pg").PoolClient,
  invoiceId: string,
  branchId: string,
  actorId: string,
) {
  await client.query(
    `
      INSERT INTO facturas_compra_ti_sucursales (
        factura_id,
        sucursal_id,
        asignada_en,
        asignada_por
      )
      VALUES ($1, $2, NOW(), $3)
      ON CONFLICT (factura_id, sucursal_id)
      DO NOTHING
    `,
    [invoiceId, branchId, actorId],
  );
}

async function resolveInvoice(
  client: import("pg").PoolClient,
  input: EquipmentInput,
  user: EquipmentAuthUser,
  branchId: string,
): Promise<string | null> {
  if (
    input.facturaModo ===
    "ASOCIAR_EXISTENTE"
  ) {
    const invoiceId =
      input.facturaExistenteId?.trim();

    if (!invoiceId) {
      throw new EquipmentServiceError(
        "INVOICE_REQUIRED",
        "Selecciona la factura que deseas asociar.",
      );
    }

    const superAdmin =
      user.roles.includes("SUPERADMIN");

    const result = superAdmin
      ? await client.query<{ id: string }>(
          `
            SELECT id
            FROM facturas_compra_ti
            WHERE id = $1
            LIMIT 1
          `,
          [invoiceId],
        )
      : await client.query<{ id: string }>(
          `
            SELECT f.id
            FROM facturas_compra_ti f
            INNER JOIN facturas_compra_ti_sucursales fs
              ON fs.factura_id = f.id
            WHERE f.id = $1
              AND fs.sucursal_id = $2
            LIMIT 1
          `,
          [invoiceId, branchId],
        );

    if (!result.rows[0]) {
      throw new EquipmentServiceError(
        "INVOICE_NOT_ALLOWED",
        "La factura no existe o no está disponible para esta sucursal.",
      );
    }

    // SUPERADMIN puede reutilizar una factura corporativa en otra
    // sucursal. La relación queda registrada desde ese momento.
    await linkInvoiceToBranch(
      client,
      invoiceId,
      branchId,
      user.id,
    );

    return invoiceId;
  }

  if (
    input.facturaModo !==
      "REGISTRAR_AHORA" ||
    !input.factura
  ) {
    // COMPLETAR_DESPUES representa explícitamente una factura
    // pendiente. En edición también puede usarse para desvincular
    // una factura existente de este equipo; la factura no se borra.
    return null;
  }

  const invoice = input.factura;

  const result = await client.query<{
    id: string;
  }>(
    `
      INSERT INTO facturas_compra_ti (
        numero_factura,
        fecha_factura,
        proveedor_nombre,
        razon_social,
        moneda,
        total,
        observaciones,
        creado_por
      )
      VALUES (
        $1,
        NULLIF($2, '')::date,
        $3,
        $4,
        COALESCE(NULLIF($5, ''), 'MXN'),
        $6,
        $7,
        $8
      )
      RETURNING id
    `,
    [
      normalizeOptional(
        invoice.numeroFactura,
      ),
      invoice.fechaFactura ?? null,
      normalizeOptional(
        invoice.proveedorNombre,
      ),
      normalizeOptional(
        invoice.razonSocial,
      ),
      invoice.moneda ?? "MXN",
      invoice.total ?? null,
      normalizeOptional(
        invoice.observaciones,
      ),
      user.id,
    ],
  );

  const invoiceId =
    result.rows[0]?.id;

  if (!invoiceId) {
    throw new Error(
      "La base de datos no devolvió la factura registrada.",
    );
  }

  await linkInvoiceToBranch(
    client,
    invoiceId,
    branchId,
    user.id,
  );

  return invoiceId;
}

function translateUniqueViolation(
  error: any,
): never {
  const constraint =
    String(error?.constraint ?? "");

  if (
    constraint.includes(
      "numero_serie",
    )
  ) {
    throw new EquipmentServiceError(
      "SERIAL_IN_USE",
      "Ya existe un equipo con ese número de serie.",
    );
  }

  if (
    constraint.includes(
      "hostname",
    )
  ) {
    throw new EquipmentServiceError(
      "HOSTNAME_IN_USE",
      "Ya existe un equipo activo con ese hostname.",
    );
  }

  throw error;
}

export async function createEquipment(
  input: EquipmentInput,
  user: EquipmentAuthUser,
) {
  await ensureBranchAccess(user, input.sucursalId);
  await ensureBranchActive(input.sucursalId);

  const {
    typeCode,
  } = await validateEquipmentCatalogs(
    input,
  );

  const hostname = normalizeOptional(input.hostname);

  if (typeCode !== "TABLET" && !hostname) {
    throw new EquipmentServiceError(
      "HOSTNAME_REQUIRED",
      "El hostname es obligatorio para laptops y desktops.",
    );
  }

  await validateUniqueFields(
    input.numeroSerie.trim(),
    hostname,
  );

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const invoiceId = await resolveInvoice(
      client,
      input,
      user,
      input.sucursalId,
    );

    const result = await client.query<{
      id: string;
      numero_inventario: string;
      numero_serie: string;
      creado_en: string;
    }>(
      `
        INSERT INTO equipos_ti (
          tipo_equipo_id,
          marca,
          modelo,
          numero_serie,
          hostname,
          direccion_ip,
          sistema_operativo,
          anydesk,
          estado_funcionamiento_id,
          condicion_fisica_id,
          observaciones,
          sucursal_id,
          departamento_id,
          responsable,
          ubicacion_exacta,
          tipo_incorporacion_id,
          factura_compra_id,
          factura_partida,
          importe_adquisicion,
          creado_por,
          actualizado_por
        )
        VALUES (
          $1,$2,$3,$4,$5,
          NULLIF($6, '')::inet,
          $7,$8,$9,$10,$11,$12,$13,$14,$15,$16,
          $17,$18,$19,$20,$20
        )
        RETURNING
          id,
          numero_inventario,
          numero_serie,
          creado_en
      `,
      [
        input.tipoEquipoId,
        input.marca.trim(),
        normalizeOptional(input.modelo),
        input.numeroSerie.trim(),
        hostname,
        typeCode === "TABLET"
          ? null
          : normalizeOptional(input.direccionIp),
        normalizeOptional(input.sistemaOperativo),
        typeCode === "TABLET"
          ? null
          : normalizeOptional(input.anydesk),
        input.estadoFuncionamientoId,
        input.condicionFisicaId,
        normalizeOptional(input.observaciones),
        input.sucursalId,
        input.departamentoId,
        normalizeOptional(input.responsable),
        input.ubicacionExacta.trim(),
        input.tipoIncorporacionId,
        invoiceId,
        normalizeOptional(input.facturaPartida),
        input.importeAdquisicion ?? null,
        user.id,
      ],
    );

    const row = result.rows[0];

    if (!row) {
      throw new Error(
        "La base de datos no devolvió el equipo registrado.",
      );
    }

    await client.query("COMMIT");

    return {
      id: row.id,
      numeroInventario: row.numero_inventario,
      numeroSerie: row.numero_serie,
      creadoEn: row.creado_en,
    };
  } catch (error: any) {
    await client.query("ROLLBACK");

    if (error?.code === "22P02") {
      throw new EquipmentServiceError(
        "INVALID_IP",
        "La dirección IP no es válida.",
      );
    }

    if (error?.code === "23505") {
      translateUniqueViolation(error);
    }

    throw error;
  } finally {
    client.release();
  }
}

async function getCurrentEquipment(
  id: string,
) {
  const result = await pool.query<{
    id: string;
    sucursal_id: string;
    version: number;
    activo: boolean;
    numero_serie: string;
    hostname: string | null;
    tipo_equipo_id: string;
    departamento_id: string;
    estado_funcionamiento_id: string;
    condicion_fisica_id: string;
    tipo_incorporacion_id: string;
  }>(
    `
      SELECT
        id,
        sucursal_id,
        version,
        activo,
        numero_serie,
        hostname,
        tipo_equipo_id,
        departamento_id,
        estado_funcionamiento_id,
        condicion_fisica_id,
        tipo_incorporacion_id
      FROM equipos_ti
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  const equipment = result.rows[0];

  if (!equipment) {
    throw new EquipmentServiceError(
      "NOT_FOUND",
      "El equipo no existe.",
    );
  }

  return equipment;
}

export async function updateEquipment(
  id: string,
  input: EquipmentUpdateInput,
  user: EquipmentAuthUser,
) {
  if (!isManager(user)) {
    throw new EquipmentServiceError(
      "FORBIDDEN",
      "No tienes permisos para editar equipos.",
    );
  }

  const current = await getCurrentEquipment(id);

  await ensureBranchAccess(user, current.sucursal_id);
  await ensureBranchAccess(user, input.sucursalId);

  if (
    input.sucursalId !==
    current.sucursal_id
  ) {
    await ensureBranchActive(
      input.sucursalId,
    );
  }

  if (!current.activo) {
    throw new EquipmentServiceError(
      "EQUIPMENT_INACTIVE",
      "Reactiva el equipo antes de editarlo.",
    );
  }

  if (current.version !== input.version) {
    throw new EquipmentServiceError(
      "VERSION_CONFLICT",
      "El equipo fue modificado por otra persona. Recarga la información antes de guardar.",
    );
  }

  const {
    typeCode,
  } = await validateEquipmentCatalogs(
    input,
    current,
  );

  const hostname = normalizeOptional(input.hostname);

  if (typeCode !== "TABLET" && !hostname) {
    throw new EquipmentServiceError(
      "HOSTNAME_REQUIRED",
      "El hostname es obligatorio para laptops y desktops.",
    );
  }

  await validateUniqueFields(
    input.numeroSerie.trim(),
    hostname,
    id,
  );

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const invoiceId = await resolveInvoice(
      client,
      input,
      user,
      input.sucursalId,
    );

    const result = await client.query<{
      id: string;
      version: number;
      actualizado_en: string;
    }>(
      `
        UPDATE equipos_ti
        SET
          tipo_equipo_id = $1,
          marca = $2,
          modelo = $3,
          numero_serie = $4,
          hostname = $5,
          direccion_ip = NULLIF($6, '')::inet,
          sistema_operativo = $7,
          anydesk = $8,
          estado_funcionamiento_id = $9,
          condicion_fisica_id = $10,
          observaciones = $11,
          sucursal_id = $12,
          departamento_id = $13,
          responsable = $14,
          ubicacion_exacta = $15,
          tipo_incorporacion_id = $16,
          factura_compra_id = $17,
          factura_partida = $18,
          importe_adquisicion = $19,
          actualizado_por = $20,
          actualizado_en = NOW(),
          version = version + 1
        WHERE id = $21
          AND version = $22
        RETURNING id, version, actualizado_en
      `,
      [
        input.tipoEquipoId,
        input.marca.trim(),
        normalizeOptional(input.modelo),
        input.numeroSerie.trim(),
        hostname,
        typeCode === "TABLET"
          ? null
          : normalizeOptional(input.direccionIp),
        normalizeOptional(input.sistemaOperativo),
        typeCode === "TABLET"
          ? null
          : normalizeOptional(input.anydesk),
        input.estadoFuncionamientoId,
        input.condicionFisicaId,
        normalizeOptional(input.observaciones),
        input.sucursalId,
        input.departamentoId,
        normalizeOptional(input.responsable),
        input.ubicacionExacta.trim(),
        input.tipoIncorporacionId,
        invoiceId,
        normalizeOptional(input.facturaPartida),
        input.importeAdquisicion ?? null,
        user.id,
        id,
        input.version,
      ],
    );

    const row = result.rows[0];

    if (!row) {
      throw new EquipmentServiceError(
        "VERSION_CONFLICT",
        "El equipo cambió mientras lo editabas. Recarga la información.",
      );
    }

    await client.query("COMMIT");

    return {
      id: row.id,
      version: row.version,
      actualizadoEn:
        row.actualizado_en,
    };
  } catch (error: any) {
    await client.query("ROLLBACK");

    if (error?.code === "22P02") {
      throw new EquipmentServiceError(
        "INVALID_IP",
        "La dirección IP no es válida.",
      );
    }

    if (error?.code === "23505") {
      translateUniqueViolation(error);
    }

    throw error;
  } finally {
    client.release();
  }
}

export async function deactivateEquipment(
  id: string,
  input: {
    motivoBajaId: string;
    detalle?: string;
    version: number;
  },
  user: EquipmentAuthUser,
) {
  if (!isManager(user)) {
    throw new EquipmentServiceError(
      "FORBIDDEN",
      "No tienes permisos para dar de baja equipos.",
    );
  }

  const current = await getCurrentEquipment(id);

  await ensureBranchAccess(user, current.sucursal_id);

  if (!current.activo) {
    throw new EquipmentServiceError(
      "ALREADY_INACTIVE",
      "El equipo ya está dado de baja.",
    );
  }

  if (current.version !== input.version) {
    throw new EquipmentServiceError(
      "VERSION_CONFLICT",
      "El equipo fue modificado. Recarga la información.",
    );
  }

  await resolveCatalogSelection(
    "motivos_baja_equipo",
    input.motivoBajaId,
    "motivo de baja",
  );

  const result = await pool.query(
    `
      UPDATE equipos_ti
      SET
        activo = FALSE,
        baja_en = NOW(),
        baja_por = $1,
        motivo_baja_id = $2,
        detalle_baja = $3,
        actualizado_por = $1,
        actualizado_en = NOW(),
        version = version + 1
      WHERE id = $4
        AND version = $5
        AND activo = TRUE
      RETURNING id, version
    `,
    [
      user.id,
      input.motivoBajaId,
      normalizeOptional(input.detalle),
      id,
      input.version,
    ],
  );

  if (!result.rows[0]) {
    throw new EquipmentServiceError(
      "VERSION_CONFLICT",
      "No fue posible completar la baja. Recarga la información.",
    );
  }

  return result.rows[0];
}

export async function reactivateEquipment(
  id: string,
  version: number,
  user: EquipmentAuthUser,
) {
  if (!isManager(user)) {
    throw new EquipmentServiceError(
      "FORBIDDEN",
      "No tienes permisos para reactivar equipos.",
    );
  }

  const current = await getCurrentEquipment(id);

  await ensureBranchAccess(
    user,
    current.sucursal_id,
  );

  await ensureBranchActive(
    current.sucursal_id,
  );

  if (current.activo) {
    throw new EquipmentServiceError(
      "ALREADY_ACTIVE",
      "El equipo ya está activo.",
    );
  }

  if (current.version !== version) {
    throw new EquipmentServiceError(
      "VERSION_CONFLICT",
      "El equipo fue modificado. Recarga la información.",
    );
  }

  // Evita convertir una colisión de serial/hostname en un 500 de
  // PostgreSQL. La misma regla se evalúa antes de reactivar.
  await validateUniqueFields(
    current.numero_serie,
    current.hostname,
    id,
  );

  try {
    const result = await pool.query(
      `
        UPDATE equipos_ti
        SET
          activo = TRUE,
          reactivado_en = NOW(),
          reactivado_por = $1,
          baja_en = NULL,
          baja_por = NULL,
          motivo_baja_id = NULL,
          detalle_baja = NULL,
          actualizado_por = $1,
          actualizado_en = NOW(),
          version = version + 1
        WHERE id = $2
          AND version = $3
          AND activo = FALSE
        RETURNING id, version
      `,
      [user.id, id, version],
    );

    if (!result.rows[0]) {
      throw new EquipmentServiceError(
        "VERSION_CONFLICT",
        "No fue posible reactivar el equipo. Recarga la información.",
      );
    }

    return result.rows[0];
  } catch (error: any) {
    if (error?.code === "23505") {
      translateUniqueViolation(error);
    }

    throw error;
  }
}

export async function getDeactivationReasons() {
  const result = await pool.query<{
    id: string;
    codigo: string;
    nombre: string;
    descripcion: string | null;
  }>(`
    SELECT id, codigo, nombre, descripcion
    FROM motivos_baja_equipo
    WHERE activo = TRUE
    ORDER BY orden, nombre
  `);

  return result.rows;
}
