import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { saves } from "../db/schema.js";
import { parseId } from "../utils/params.js";

/**
 * Confere se o save da URL existe E é do usuário logado (req.user.id).
 * Se for, guarda em req.save e deixa passar. Se não, responde 404 —
 * propositalmente 404 (e não 403) pra não revelar que o save de outra
 * pessoa existe.
 *
 * Precisa vir DEPOIS do requireAuth (que preenche req.user).
 *
 * Uso: ownsSave("id")      → rotas tipo /saves/:id
 *      ownsSave("saveId")  → rotas tipo /saves/:saveId/inventory
 */
export function ownsSave(paramName = "id") {
  return async (req, res, next) => {
    const saveId = parseId(req.params[paramName]);

    if (saveId === null) {
      return res.status(400).json({ error: "ID de save inválido." });
    }

    const [save] = await db
      .select()
      .from(saves)
      .where(and(eq(saves.id, saveId), eq(saves.userId, req.user.id)));

    if (!save) {
      return res.status(404).json({ error: "Save não encontrado." });
    }

    req.save = save;
    next();
  };
}