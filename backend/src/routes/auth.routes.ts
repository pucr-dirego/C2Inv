import { Router } from "express";
import rateLimit from "express-rate-limit";

import {
  login,
  logout,
  me,
  register,
  registrationBranches,
} from "../controllers/auth.controller.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    ok: false,
    code: "TOO_MANY_ATTEMPTS",
    message:
      "Demasiados intentos. Intenta nuevamente más tarde.",
  },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    ok: false,
    code: "TOO_MANY_ATTEMPTS",
    message:
      "Demasiadas solicitudes. Intenta nuevamente más tarde.",
  },
});

router.get("/branches", registrationBranches);
router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);
router.get("/me", me);
router.post("/logout", logout);

export default router;
