import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { equippedItems, inventoryItems, items } from "../db/schema.js";
import { parseId } from "../utils/params.js";
import { ITEMS } from "../game/Content.js";

// Quantos itens cabem em cada slot (anel tem 2, o resto só 1).
const SLOT_LIMITS = { ring: 2 };

// Qual tipo de item (items.type) cada slot aceita.
const ALLOWED_TYPES = {
  weapon: ["weapon"],
  shield: ["shield"],
  helmet: ["helmet"],
  chest: ["chest"],
  pants: ["pants"],
  boots: ["boots"],
  ring: ["accessory"],
};


// Compatibilidade com armaduras antigas salvas no banco com type="armor".
// O nome identifica o slot correto sem permitir equipar uma peça em qualquer lugar.
function normalizedEquipmentType(item) {
  if (item.type !== "armor") return item.type;
  const name = String(item.name || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/\b(elmo|capacete|helmet)\b/.test(name)) return "helmet";
  if (/\b(bota|botas|boot|boots)\b/.test(name)) return "boots";
  if (/\b(calca|calcas|pants)\b/.test(name)) return "pants";
  if (/\b(escudo|shield)\b/.test(name)) return "shield";
  if (/\b(peitoral|cota|tunica|manto|armadura|chest|torso)\b/.test(name)) return "chest";
  return "armor";
}

function limitFor(slot) {
  return SLOT_LIMITS[slot] ?? 1;
}

function typeProblem(slot, item) {
  const itemType = normalizedEquipmentType(item);
  if (ALLOWED_TYPES[slot]?.includes(itemType)) return null;
  return `O slot "${slot}" só aceita itens do tipo: ${(ALLOWED_TYPES[slot] ?? []).join(", ")}. Tipo identificado: ${itemType}.`;
}


async function inventoryRows(saveId) {
  return db.select().from(inventoryItems).where(eq(inventoryItems.saveId, saveId));
}

async function hasItem(saveId, itemId) {
  const rows = await inventoryRows(saveId);
  return rows.some((row) => row.itemId === itemId && row.quantity > 0);
}

async function removeOneFromInventory(saveId, itemId) {
  const rows = await inventoryRows(saveId);
  const row = rows.find((entry) => entry.itemId === itemId);
  if (!row) return false;
  if (row.quantity <= 1) await db.delete(inventoryItems).where(eq(inventoryItems.id, row.id));
  else await db.update(inventoryItems).set({ quantity: row.quantity - 1 }).where(eq(inventoryItems.id, row.id));
  return true;
}

async function canStoreItem(saveId, itemId, removingItemId = null) {
  const rows = await inventoryRows(saveId);
  const oldStack = rows.find((row) => row.itemId === itemId);
  if (oldStack) return oldStack.quantity < 99;
  const slotsAfterRemoval = rows.length - (removingItemId && rows.some((row) => row.itemId === removingItemId && row.quantity === 1) ? 1 : 0);
  return slotsAfterRemoval < 16;
}

async function addOneToInventory(saveId, itemId) {
  const rows = await inventoryRows(saveId);
  const existing = rows.find((row) => row.itemId === itemId);
  if (existing) {
    if (existing.quantity >= 99) throw new Error("Pilha de inventário cheia.");
    await db.update(inventoryItems).set({ quantity: existing.quantity + 1 }).where(eq(inventoryItems.id, existing.id));
    return;
  }
  if (rows.length >= 16) throw new Error("Inventário cheio.");
  await db.insert(inventoryItems).values({ saveId, itemId, quantity: 1 });
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

  res.json(rows.map((row) => {
    const definition = ITEMS.find((item) => item.name === row.name);
    return {
      ...row,
      type: normalizedEquipmentType(row),
      rarity: definition?.rarity ?? "comum",
      stats: definition?.stats ?? {},
      price: definition?.price ?? 0,
    };
  }));
}

// POST /saves/:saveId/equipment — equipa um item num slot
export async function equipItem(req, res) {
  const { itemId, slot } = req.body;

  const [item] = await db.select().from(items).where(eq(items.id, itemId));

  if (!item) {
    return res.status(404).json({ error: "Item não encontrado no catálogo." });
  }

  const problem = typeProblem(slot, item);
  if (problem) {
    return res.status(400).json({ error: problem });
  }

  if (!await hasItem(req.save.id, itemId)) {
    return res.status(409).json({ error: "Você precisa possuir o item no inventário para equipá-lo." });
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

  await removeOneFromInventory(req.save.id, itemId);
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

  const problem = typeProblem(equipped.slot, item);
  if (problem) {
    return res.status(400).json({ error: problem });
  }
  if (item.id === equipped.itemId) return res.status(400).json({ error: "Este item já está equipado." });
  if (!await hasItem(req.save.id, item.id)) return res.status(409).json({ error: "Você precisa possuir o novo item no inventário." });
  if (!await canStoreItem(req.save.id, equipped.itemId, item.id)) return res.status(409).json({ error: "O inventário está cheio; libere um espaço antes de trocar o equipamento." });

  const [updated] = await db
    .update(equippedItems)
    .set({ itemId: item.id })
    .where(eq(equippedItems.id, equipped.id))
    .returning();
  await removeOneFromInventory(req.save.id, item.id);
  await addOneToInventory(req.save.id, equipped.itemId);

  res.json(updated);
}

// DELETE /saves/:saveId/equipment/:id — desequipa
export async function unequipItem(req, res) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "ID inválido." });
  }

  const [existing] = await db.select().from(equippedItems)
    .where(and(eq(equippedItems.id, id), eq(equippedItems.saveId, req.save.id)));
  if (!existing) return res.status(404).json({ error: "Equipamento não encontrado." });
  if (!await canStoreItem(req.save.id, existing.itemId)) return res.status(409).json({ error: "Inventário cheio; libere um espaço antes de desequipar." });

  const [removed] = await db
    .delete(equippedItems)
    .where(and(eq(equippedItems.id, id), eq(equippedItems.saveId, req.save.id)))
    .returning();

  if (!removed) {
    return res.status(404).json({ error: "Equipamento não encontrado." });
  }

  await addOneToInventory(req.save.id, removed.itemId);
  res.status(204).send();
}