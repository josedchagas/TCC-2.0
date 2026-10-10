import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { equippedItems, items } from "../db/schema.js";
import { parseId } from "../utils/params.js";

// Quantos itens cabem em cada slot (anel tem 2, o resto só 1).
const SLOT_LIMITS = { ring: 2 };

// Qual tipo de item (items.type) cada slot aceita.
const ALLOWED_TYPES = {
  weapon: ["weapon"],
  shield: ["armor"],
  helmet: ["armor"],
  chest: ["armor"],
  pants: ["armor"],
  boots: ["armor"],
  ring: ["accessory"],
};

function limitFor(slot) {
  return SLOT_LIMITS[slot] ?? 1;
}

function typeProblem(slot, itemType) {
  if (ALLOWED_TYPES[slot].includes(itemType)) return null;
  return `O slot "${slot}" só aceita itens do tipo: ${ALLOWED_TYPES[slot].join(", ")}.`;
}

// GET /saves/:saveId/equipment
export async function listEquipment(req, res) {
  const rows = await db
    .select({
      id: equippedItems.id,
      slot: equippedItems.slot,
      itemId: items.id,
      name: items.name,
      type: items.type,
      iconUrl: items.iconUrl,
      description: items.description,
    })
    .from(equippedItems)
    .innerJoin(items, eq(equippedItems.itemId, items.id))
    .where(eq(equippedItems.saveId, req.save.id));

  res.json(rows);
}

// POST /saves/:saveId/equipment — equipa um item num slot
export async function equipItem(req, res) {
  const { itemId, slot } = req.body;

  const [item] = await db.select().from(items).where(eq(items.id, itemId));

  if (!item) {
    return res.status(404).json({ error: "Item não encontrado no catálogo." });
  }

  const problem = typeProblem(slot, item.type);
  if (problem) {
    return res.status(400).json({ error: problem });
  }

  const inSlot = await db
    .select({ id: equippedItems.id })
    .from(equippedItems)
    .where(and(eq(equippedItems.saveId, req.save.id), eq(equippedItems.slot, slot)));

  if (inSlot.length >= limitFor(slot)) {
    return res
      .status(409)
      .json({ error: `Slot "${slot}" já está ocupado. Desequipe antes de equipar outro.` });
  }

  const [created] = await db
    .insert(equippedItems)
    .values({ saveId: req.save.id, itemId, slot })
    .returning();

  res.status(201).json(created);
}

// PUT /saves/:saveId/equipment/:id — troca o item equipado, mantendo o slot
export async function swapEquippedItem(req, res) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "ID inválido." });
  }

  const [equipped] = await db
    .select()
    .from(equippedItems)
    .where(and(eq(equippedItems.id, id), eq(equippedItems.saveId, req.save.id)));

  if (!equipped) {
    return res.status(404).json({ error: "Equipamento não encontrado." });
  }

  const [item] = await db.select().from(items).where(eq(items.id, req.body.itemId));

  if (!item) {
    return res.status(404).json({ error: "Item não encontrado no catálogo." });
  }

  const problem = typeProblem(equipped.slot, item.type);
  if (problem) {
    return res.status(400).json({ error: problem });
  }

  const [updated] = await db
    .update(equippedItems)
    .set({ itemId: item.id })
    .where(eq(equippedItems.id, equipped.id))
    .returning();

  res.json(updated);
}

// DELETE /saves/:saveId/equipment/:id — desequipa
export async function unequipItem(req, res) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "ID inválido." });
  }

  const [removed] = await db
    .delete(equippedItems)
    .where(and(eq(equippedItems.id, id), eq(equippedItems.saveId, req.save.id)))
    .returning();

  if (!removed) {
    return res.status(404).json({ error: "Equipamento não encontrado." });
  }

  res.status(204).send();
}