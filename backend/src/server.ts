import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";

import { pool } from "./db/pool.js";
import authRoutes from "./routes/auth.routes.js";
import catalogsRoutes from "./routes/catalogs.routes.js";
import equipmentRoutes from "./routes/equipment.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import reportsRoutes from "./routes/reports.routes.js";

const app = express();
const PORT = Number(process.env.PORT ?? 3002);

const allowedOrigins = (
  process.env.FRONTEND_ORIGIN ??
  "http://localhost:5173"
)
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

app.set("trust proxy", 1);

app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origen no permitido por CORS."));
    },
    credentials: true,
    exposedHeaders: [
      "Content-Disposition",
      "X-Report-Rows",
      "X-Report-Columns",
      "X-Report-Pages",
      "X-Report-Sheets",
      "X-Report-Generation-Ms",
    ],
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/health", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        NOW() AS database_time,
        current_database() AS database
    `);

    res.status(200).json({
      ok: true,
      service: "Sistema de Inventarios TI API",
      database: "connected",
      databaseName: result.rows[0]?.database,
      databaseTime: result.rows[0]?.database_time,
    });
  } catch (error) {
    console.error("Error verificando PostgreSQL:", error);

    res.status(500).json({
      ok: false,
      service: "Sistema de Inventarios TI API",
      database: "disconnected",
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/catalogos", catalogsRoutes);
app.use("/api/equipos", equipmentRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/reports", reportsRoutes);

app.use((_req, res) => {
  res.status(404).json({
    ok: false,
    code: "NOT_FOUND",
    message: "La ruta solicitada no existe.",
  });
});

app.listen(PORT, () => {
  console.log("");
  console.log("==========================================");
  console.log(" Sistema de Inventarios TI");
  console.log(` API: http://localhost:${PORT}`);
  console.log(` Health: http://localhost:${PORT}/health`);
  console.log("==========================================");
  console.log("");
});
