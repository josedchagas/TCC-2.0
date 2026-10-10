import "dotenv/config";
import express from "express";
import cors from "cors";
import { sql } from "drizzle-orm";
import { db } from "./db/index.js";
import authRoutes from "./routes/auth.routes.js";
import itemsRoutes from "./routes/items.routes.js";
import savesRoutes from "./routes/saves.routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 3000;
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:5173")
  .split(",").map((origin) => origin.trim()).filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origem não autorizada pelo CORS."));
  },
  credentials: true,
}));
app.use(express.json({ limit: "100kb" }));

app.get("/", (_req, res) => res.json({ status: "ok", message: "API do RPG rodando" }));
app.get("/health/db", async (_req, res, next) => {
  try {
    await db.execute(sql`select 1`);
    res.json({ database: "conectado" });
  } catch (error) { next(error); }
});

app.use("/auth", authRoutes);
app.use("/items", itemsRoutes);
app.use("/saves", savesRoutes);
app.use(errorHandler);
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
