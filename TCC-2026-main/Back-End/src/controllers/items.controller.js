import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { items } from "../db/schema.js";

// GET /items
export async function listItems(req, res) {
  const all = await db.select().from(items);
  res.json(all);
}

// GET /items/:id (numero sem o ":")
export async function getItem(req, res) {
  const id = Number(req.params.id);
  const [item] = await db.select().from(items).where(eq(items.id, id));

  if (!item) {
    return res.status(404).json({ error: "Item não encontrado." });
  }

  res.json(item);
}

// POST /items
export async function createItem(req, res) {
  const [item] = await db.insert(items).values(req.body).returning();
  res.status(201).json(item);
}

// PUT /items/:id (numero sem o ":")
export async function updateItem(req, res) {
  const id = Number(req.params.id);

  const [item] = await db
    .update(items)
    .set(req.body)
    .where(eq(items.id, id))
    .returning();

  if (!item) {
    return res.status(404).json({ error: "Item não encontrado." });
  }

  res.json(item);
}

// DELETE /items/:id (numero sem o ":")
export async function deleteItem(req, res) {
  const id = Number(req.params.id);

  const [item] = await db.delete(items).where(eq(items.id, id)).returning();

  if (!item) {
    return res.status(404).json({ error: "Item não encontrado." });
  }

  res.status(204).send();
}