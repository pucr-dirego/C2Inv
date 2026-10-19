import { Router } from "express";

import {
  access,
  approve,
  block,
  branchStatus,
  branches,
  catalogs,
  revokeSessions,
  unblock,
  users,
} from "../controllers/admin.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRoles } from "../middleware/authorize.js";

const router = Router();

router.use(requireAuth);
router.use(requireRoles("SUPERADMIN"));

router.get("/users", users);
router.get("/catalogs", catalogs);
router.get("/branches", branches);
router.patch(
  "/branches/:id/status",
  branchStatus,
);
router.post("/users/:id/approve", approve);
router.put("/users/:id/access", access);
router.post("/users/:id/block", block);
router.post("/users/:id/unblock", unblock);
router.post(
  "/users/:id/revoke-sessions",
  revokeSessions,
);

export default router;
