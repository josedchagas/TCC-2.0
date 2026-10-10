import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";

// Consulta o papel atual no banco; nunca confia em permissões enviadas pelo cliente.
export async function requireAdmin(req, res, next) {
  try {
    const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, req.user.id));
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Esta operação exige permissão de administrador." });
    }
    req.user.role = user.role;
    return next();
  } catch (error) {
    return next(error);
  }
}
