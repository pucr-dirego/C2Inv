import { Router } from "express";

import {
  create,
  deactivate,
  deactivationReasons,
  reactivate,
  update,
} from "../controllers/equipment.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRoles } from "../middleware/authorize.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/motivos-baja",
  requireRoles("SUPERADMIN", "GERENTE"),
  deactivationReasons,
);

router.post("/", create);

router.put(
  "/:id",
  requireRoles("SUPERADMIN", "GERENTE"),
  update,
);

router.post(
  "/:id/baja",
  requireRoles("SUPERADMIN", "GERENTE"),
  deactivate,
);

router.post(
  "/:id/reactivar",
  requireRoles("SUPERADMIN", "GERENTE"),
  reactivate,
);

export default router;
