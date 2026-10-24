import { asc, eq, gt, lt, and, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { saves } from "../db/schema.js";

const MAX_SAVES_PER_USER = 8;
const CHARACTER_PRESETS = {
  elyra: { characterName: "Elyra", classRole: "Arqueira", forca: 6, destreza: 16, inteligencia: 9, resistencia: 8, agilidade: 14 },
  bram: { characterName: "Bram", classRole: "Guerreiro", forca: 15, destreza: 8, inteligencia: 6, resistencia: 17, agilidade: 7 },
  sora: { characterName: "Sora", classRole: "Maga", forca: 5, destreza: 9, inteligencia: 18, resistencia: 6, agilidade: 10 },
  toren: { characterName: "Toren", classRole: "Ladino", forca: 8, destreza: 15, inteligencia: 11, resistencia: 9, agilidade: 16 },
};

async function normalizeFixedPips(save) {
  const hpCurrent = Math.min(5, save.hpCurrent);
  const energyCurrent = Math.min(5, save.energyCurrent);
  if (save.hpMax === 5 && save.energyMax === 5 && hpCurrent === save.hpCurrent && energyCurrent === save.energyCurrent) return save;
  const [updated] = await db.update(saves).set({
    hpCurrent, hpMax: 5, energyCurrent, energyMax: 5,
    updatedAt: new Date(),
  }).where(eq(saves.id, save.id)).returning();
  return updated;
}

export async function listSaves(req, res) {
  const rows = await db.select().from(saves).where(eq(saves.userId, req.user.id)).orderBy(asc(saves.slotNumber));
  const normalized = await Promise.all(rows.map(normalizeFixedPips));
  res.json(normalized);
}

export async function getSave(req, res) {
  res.json(await normalizeFixedPips(req.save));
}

export async function createSave(req, res) {
  const userId = req.user.id;
  const mine = await db.select({ slotNumber: saves.slotNumber }).from(saves).where(eq(saves.userId, userId));
  if (mine.length >= MAX_SAVES_PER_USER) {
    return res.status(409).json({ error: `Limite de ${MAX_SAVES_PER_USER} saves atingido.` });
  }
  if (mine.some((save) => save.slotNumber === req.body.slotNumber)) {
    return res.status(409).json({ error: "Esse slot já está ocupado." });
  }

  const preset = CHARACTER_PRESETS[req.body.characterId];
  if (!preset) return res.status(400).json({ error: "Personagem inicial inválido." });

  // Valores iniciais e atributos vêm do servidor, não do payload do cliente.
  const [save] = await db.insert(saves).values({
    userId,
    slotNumber: req.body.slotNumber,
    ...preset,
    chapterCurrent: 1,
    chapterMax: 1,
    xpCurrent: 0,
    xpMax: 100,
    hpCurrent: 5,
    hpMax: 5,
    energyCurrent: 5,
    energyMax: 5,
    money: 0,
    availablePoints: 0,
  }).returning();
  res.status(201).json(save);
}

export async function updateSave(req, res) {
  const now = new Date();
  const [save] = await db.update(saves)
    .set({ characterName: req.body.characterName, updatedAt: now, lastPlayedAt: now })
    .where(eq(saves.id, req.save.id)).returning();
  res.json(save);
}

// Ação segura de evolução: um ponto disponível, atributo abaixo de 20, e alteração no servidor.
export async function spendPoint(req, res) {
  if (req.save.completed || req.save.hpCurrent <= 0 || req.save.energyCurrent <= 0) {
    return res.status(409).json({ error: "Este save foi encerrado e não pode mais ser alterado." });
  }
  const { stat } = req.body;
  if (req.save.availablePoints < 1) {
    return res.status(409).json({ error: "Você não possui pontos disponíveis." });
  }
  if (req.save[stat] >= 20) {
    return res.status(409).json({ error: "Esse atributo já atingiu o limite." });
  }

  const now = new Date();
  // Atualização condicional atômica: duas requisições simultâneas não conseguem
  // gastar o mesmo ponto nem ultrapassar o limite do atributo.
  const [updated] = await db.update(saves).set({
    [stat]: sql`${saves[stat]} + 1`,
    availablePoints: sql`${saves.availablePoints} - 1`,
    updatedAt: now,
    lastPlayedAt: now,
  }).where(and(
    eq(saves.id, req.save.id),
    gt(saves.availablePoints, 0),
    lt(saves[stat], 20),
  )).returning();
  if (!updated) return res.status(409).json({ error: "Pontos indisponíveis ou atributo no limite." });
  res.json(updated);
}

export async function deleteSave(req, res) {
  await db.delete(saves).where(eq(saves.id, req.save.id));
  res.status(204).send();
}
