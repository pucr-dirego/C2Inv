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

async function getEquipmentTypeCode(
  typeId: string,
): Promise<string> {
  const result = await pool.query<{ codigo: string }>(
    `
      SELECT codigo
      FROM tipos_equipo
      WHERE id = $1
        AND activo = TRUE
      LIMIT 1
    `,
    [typeId],
  );

  const code = result.rows[0]?.codigo;

  if (!code) {
    throw new EquipmentServiceError(
      "INVALID_EQUIPMENT_TYPE",
      "El tipo de equipo seleccionado no es válido.",
    );
  }

  return code;
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

async function validateUniqueFields(
  serial: string,
  hostname: string | null,
  excludeId?: string,
) {
  const serialResult = await pool.query(
    `
      SELECT id
      FROM equipos_ti
      WHERE activo = TRUE
        AND LOWER(numero_serie) = LOWER($1)
        AND ($2::uuid IS NULL OR id <> $2::uuid)
      LIMIT 1
    `,
    [serial, excludeId ?? null],
  );

  if ((serialResult.rowCount ?? 0) > 0) {
    throw new EquipmentServiceError(
      "SERIAL_IN_USE",
      "Ya existe un equipo activo con ese número de serie.",
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

async function resolveInvoice(
  client: import("pg").PoolClient,
  input: EquipmentInput,
  userId: string,
): Promise<string | null> {
  if (input.facturaModo === "ASOCIAR_EXISTENTE") {
    return input.facturaExistenteId || null;
  }

  if (
    input.facturaModo !== "REGISTRAR_AHORA" ||
    !input.factura
  ) {
    return null;
  }

  const invoice = input.factura;

  const result = await client.query<{ id: string }>(
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
      normalizeOptional(invoice.numeroFactura),
      invoice.fechaFactura ?? null,
      normalizeOptional(invoice.proveedorNombre),
      normalizeOptional(invoice.razonSocial),
      invoice.moneda ?? "MXN",
      invoice.total ?? null,
      normalizeOptional(invoice.observaciones),
      userId,
    ],
  );

  return result.rows[0]?.id ?? null;
}

export async function createEquipment(
  input: EquipmentInput,
  user: EquipmentAuthUser,
) {
  await ensureBranchAccess(user, input.sucursalId);

  const typeCode = await getEquipmentTypeCode(
    input.tipoEquipoId,
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
      user.id,
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

    await client.query("COMMIT");

    const row = result.rows[0];

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
  }>(
    `
      SELECT
        id,
        sucursal_id,
        version,
        activo
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

  const typeCode = await getEquipmentTypeCode(
    input.tipoEquipoId,
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

  const result = await pool.query<{
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
        factura_partida = $17,
        importe_adquisicion = $18,
        actualizado_por = $19,
        actualizado_en = NOW(),
        version = version + 1
      WHERE id = $20
        AND version = $21
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
      normalizeOptional(input.facturaPartida),
      input.importeAdquisicion ?? null,
      user.id,
      id,
      input.version,
    ],
  );

  if (!result.rows[0]) {
    throw new EquipmentServiceError(
      "VERSION_CONFLICT",
      "El equipo cambió mientras lo editabas. Recarga la información.",
    );
  }

  return {
    id: result.rows[0].id,
    version: result.rows[0].version,
    actualizadoEn: result.rows[0].actualizado_en,
  };
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

  await ensureBranchAccess(user, current.sucursal_id);

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
