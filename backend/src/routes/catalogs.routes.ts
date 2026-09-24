import { Router } from "express";

import { equipmentCatalogs } from "../controllers/catalogs.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.get("/equipos", requireAuth, equipmentCatalogs);

export default router;
