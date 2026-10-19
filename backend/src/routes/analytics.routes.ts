import { Router } from "express";

import { geography } from "../controllers/analytics.controller.js";
import { requireRoles } from "../middleware/authorize.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/geography",
  requireRoles("SUPERADMIN", "GERENTE"),
  geography,
);

export default router;
