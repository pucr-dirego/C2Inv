import { Router } from "express";

import {
  exportPdf,
  exportXlsx,
  options,
  preview,
} from "../controllers/reports.controller.js";

import { requireAuth } from "../middleware/requireAuth.js";
import { requireRoles } from "../middleware/authorize.js";

const router = Router();

// ======================================================
// SEGURIDAD DEL MÓDULO
// ======================================================

/**
 * Todas las rutas de Reportes requieren:
 *
 * 1. sesión válida;
 * 2. rol GERENTE o SUPERADMIN.
 *
 * La restricción concreta por sucursal NO vive aquí.
 * La resuelve reportsScope.service.ts.
 */
router.use(requireAuth);

router.use(
  requireRoles(
    "SUPERADMIN",
    "GERENTE",
  ),
);

// ======================================================
// OPCIONES DEL CONFIGURADOR
// ======================================================

router.get(
  "/options",
  options,
);

// ======================================================
// VISTA PREVIA
// ======================================================

router.post(
  "/preview",
  preview,
);

// ======================================================
// EXPORTACIÓN PDF
// ======================================================

router.post(
  "/export/pdf",
  exportPdf,
);

// ======================================================
// EXPORTACIÓN EXCEL
// ======================================================

router.post(
  "/export/xlsx",
  exportXlsx,
);

export default router;
