import { Router } from "express";

import {
  detail,
  list,
  mine,
  overview,
} from "../controllers/inventory.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRoles } from "../middleware/authorize.js";

const router = Router();

router.use(requireAuth);

router.get("/mine", mine);

router.get(
  "/overview",
  requireRoles("SUPERADMIN", "GERENTE"),
  overview,
);

router.get(
  "/equipment",
  requireRoles("SUPERADMIN", "GERENTE"),
  list,
);

router.get("/equipment/:id", detail);

export default router;
