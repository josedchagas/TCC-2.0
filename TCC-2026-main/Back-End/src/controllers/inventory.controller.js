import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { inventoryItems, items } from "../db/schema.js";
import { parseId } from "../utils/params.js";

const MAX_INVENTORY_SLOTS = 8; // os 8 slots do CharacterPanel
const MAX_STACK = 99;

// GET /saves/:saveId/inventory — já traz os dados do item (nome, ícone...)
export async function listInventory(req, res) {
  const rows = await db
    .select({
      id: inventoryItems.id,
      quantity: inventoryItems.quantity,
      itemId: items.id,
      name: items.name,
      type: items.type,
      iconUrl: items.iconUrl,
      description: items.description,
    })
    .from(inventoryItems)
    .innerJoin(items, eq(inventoryItems.itemId, items.id))
    .where(eq(inventoryItems.saveId, req.save.id));

  res.json(rows);
}

// POST /saves/:saveId/inventory — se o item já está no inventário, soma a quantidade
export async function addToInventory(req, res) {
  const { itemId, quantity } = req.body;

  const [item] = await db
    .select({ id: items.id })
    .from(items)
    .where(eq(items.id, itemId));

  if (!item) {
    return res.status(404).json({ error: "Item não encontrado no catálogo." });
  }

  const current = await db
    .select()
    .from(inventoryItems)
    .where(eq(inventoryItems.saveId, req.save.id));

  const existing = current.find((row) => row.itemId === itemId);

  if (existing) {
    const newQuantity = existing.quantity + quantity;

    if (newQuantity > MAX_STACK) {
      return res
        .status(409)
        .json({ error: `Cada item acumula no máximo ${MAX_STACK} unidades.` });
    }

    const [updated] = await db
      .update(inventoryItems)
      .set({ quantity: newQuantity })
      .where(eq(inventoryItems.id, existing.id))
      .returning();

    return res.json(updated);
  }

  if (current.length >= MAX_INVENTORY_SLOTS) {
    return res
      .status(409)
      .json({ error: `Inventário cheio (máximo de ${MAX_INVENTORY_SLOTS} slots).` });
  }

  const [created] = await db
    .insert(inventoryItems)
    .values({ saveId: req.save.id, itemId, quantity })
    .returning();

  res.status(201).json(created);
}

// PUT /saves/:saveId/inventory/:id — muda a quantidade
export async function updateInventoryItem(req, res) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "ID inválido." });
  }

  const [updated] = await db
    .update(inventoryItems)
    .set({ quantity: req.body.quantity })
    .where(and(eq(inventoryItems.id, id), eq(inventoryItems.saveId, req.save.id)))
    .returning();

  if (!updated) {
    return res.status(404).json({ error: "Item não encontrado no inventário." });
  }

  res.json(updated);
}

// DELETE /saves/:saveId/inventory/:id
export async function removeFromInventory(req, res) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "ID inválido." });
  }

  const [removed] = await db
    .delete(inventoryItems)
    .where(and(eq(inventoryItems.id, id), eq(inventoryItems.saveId, req.save.id)))
    .returning();

  if (!removed) {
    return res.status(404).json({ error: "Item não encontrado no inventário." });
  }

  res.status(204).send();
}