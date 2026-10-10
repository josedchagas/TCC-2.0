import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema.js";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL não encontrada. Copie .env.example para .env e preencha com a connection string do Neon."
  );
}

const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { schema });