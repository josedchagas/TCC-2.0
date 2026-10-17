import "dotenv/config";
import express from "express";
import cors from "cors";
import { sql, eq, lt, or } from "drizzle-orm";
import { db } from "./db/index.js";
import { items, saves } from "./db/schema.js";
import { ITEMS } from "./game/content.js";
import authRoutes from "./routes/auth.routes.js";
import itemsRoutes from "./routes/items.routes.js";
import savesRoutes from "./routes/saves.routes.js";
import gameRoutes from "./routes/game.routes.js";
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
app.use("/game", gameRoutes);
app.use(errorHandler);
async function seedGameItems() {
  const existingRows = await db.select({ name: items.name }).from(items);
  const existingNames = new Set(existingRows.map((row) => row.name));
  const missing = ITEMS.filter((item) => !existingNames.has(item.name));
  if (missing.length) {
    await db.insert(items).values(missing.map((item) => ({
      name: item.name, type: item.type, iconUrl: null, description: item.description,
    })));
  }
}

async function migrateLegacySaves() {
  // Converte saves criados antes da campanha de 20 capítulos e do sistema de vida em pontos.
  await db.update(saves).set({
    hpCurrent: sql`100 + (${saves.resistencia} * 5)`,
    hpMax: sql`100 + (${saves.resistencia} * 5)`,
    energyCurrent: sql`50 + (${saves.inteligencia} * 2)`,
    energyMax: sql`50 + (${saves.inteligencia} * 2)`,
    chapterMax: 20,
  }).where(or(lt(saves.hpMax, 20), lt(saves.energyMax, 20), lt(saves.chapterMax, 20)));
}

seedGameItems()
  .then(migrateLegacySaves)
  .then(() => app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`)))
  .catch((error) => {
    console.error("Falha ao preparar o banco para a campanha:", error);
    process.exit(1);
  });
