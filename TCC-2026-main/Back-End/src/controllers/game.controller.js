import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { defeatedEncounters, equippedItems, inventoryItems, items, saves } from "../db/schema.js";
import { CHAPTERS, ITEMS, SHOPS, getEnemyById, getItemByCode } from "../game/Content.js";
import { SIDE_QUESTS, getChapterSideQuests, getSideQuest } from "../game/SideQuests.js";

const MAX_INVENTORY_SLOTS = 8;
const MAX_STACK = 99;

export async function listDefeatedEncounters(req, res) {
  const rows = await db.select({ enemyCode: defeatedEncounters.enemyCode }).from(defeatedEncounters).where(eq(defeatedEncounters.saveId, req.save.id));
  res.json(rows.map((row) => row.enemyCode));
}

export async function getCampaign(_req, res) {
  res.json({ chapterCount: CHAPTERS.length, chapters: CHAPTERS.map(({ enemies, ...chapter }) => chapter) });
}

export async function getChapter(req, res) {
  const number = Number(req.params.chapterNumber);
  const chapter = CHAPTERS.find((candidate) => candidate.number === number);
  if (!chapter) return res.status(404).json({ error: "Capítulo não encontrado." });
  res.json(chapter);
}

export async function getCatalog(_req, res) {
  res.json(ITEMS);
}

export async function getShop(req, res) {
  const chapterNumber = Number(req.params.chapterNumber ?? req.query.chapter);
  const shop = SHOPS[chapterNumber];
  if (!shop) return res.status(404).json({ error: "Não há loja disponível neste capítulo." });
  res.json({ chapter: chapterNumber, name: shop.name, greeting: shop.greeting, items: shop.itemCodes.map(getItemByCode).filter(Boolean) });
}

async function getOrCreateDbItem(itemDef) {
  const [existing] = await db.select().from(items).where(eq(items.name, itemDef.name));
  if (existing) return existing;
  const [created] = await db.insert(items).values({ name: itemDef.name, type: itemDef.type, iconUrl: null, description: itemDef.description }).returning();
  return created;
}

async function grantItem(saveId, itemDef, quantity = 1) {
  const dbItem = await getOrCreateDbItem(itemDef);
  const current = await db.select().from(inventoryItems).where(eq(inventoryItems.saveId, saveId));
  const existing = current.find((row) => row.itemId === dbItem.id);
  if (existing) {
    if (existing.quantity + quantity > MAX_STACK) return { granted: false, reason: "stack_full" };
    await db.update(inventoryItems).set({ quantity: existing.quantity + quantity }).where(eq(inventoryItems.id, existing.id));
    return { granted: true, item: itemDef.name, quantity };
  }
  if (current.length >= MAX_INVENTORY_SLOTS) return { granted: false, reason: "inventory_full" };
  await db.insert(inventoryItems).values({ saveId, itemId: dbItem.id, quantity });
  return { granted: true, item: itemDef.name, quantity };
}

export async function buyItem(req, res) {
  const save = req.save;
  const { itemCode, quantity = 1 } = req.body;
  const shop = SHOPS[save.chapterCurrent];
  if (!shop) return res.status(409).json({ error: "Não existe loja aberta neste capítulo." });
  if (!shop.itemCodes.includes(itemCode)) return res.status(400).json({ error: "Este item não está disponível nesta loja." });
  const itemDef = getItemByCode(itemCode);
  if (!itemDef || itemDef.price <= 0) return res.status(400).json({ error: "Este item não pode ser comprado." });
  const total = itemDef.price * quantity;
  if (!Number.isSafeInteger(total) || quantity < 1 || quantity > 99) return res.status(400).json({ error: "Quantidade inválida." });

  const dbItem = await getOrCreateDbItem(itemDef);
  const current = await db.select().from(inventoryItems).where(eq(inventoryItems.saveId, save.id));
  const existing = current.find((row) => row.itemId === dbItem.id);
  if (existing && existing.quantity + quantity > MAX_STACK) return res.status(409).json({ error: "Não há espaço suficiente na pilha deste item." });
  if (!existing && current.length >= MAX_INVENTORY_SLOTS) return res.status(409).json({ error: "Inventário cheio." });

  const [charged] = await db.update(saves).set({ money: sql`${saves.money} - ${total}`, updatedAt: new Date(), lastPlayedAt: new Date() })
    .where(and(eq(saves.id, save.id), gte(saves.money, total))).returning();
  if (!charged) return res.status(409).json({ error: "Você não tem dinheiro suficiente." });
  try {
    const granted = await grantItem(save.id, itemDef, quantity);
    if (!granted.granted) throw new Error("O inventário ficou indisponível durante a compra.");
  } catch (error) {
    // Reverte o débito se a gravação do inventário falhar.
    await db.update(saves).set({ money: sql`${saves.money} + ${total}` }).where(eq(saves.id, save.id));
    throw error;
  }
  const [updatedSave] = await db.select().from(saves).where(eq(saves.id, save.id));
  res.json({ message: `Comprou ${quantity}x ${itemDef.name}.`, item: itemDef, save: updatedSave });
}

export async function resolveEncounter(req, res) {
  const save = req.save;
  const enemy = getEnemyById(req.params.enemyId);
  if (!enemy) return res.status(404).json({ error: "Inimigo não encontrado." });
  if (enemy.chapter !== save.chapterCurrent) return res.status(409).json({ error: "Esse inimigo não pertence ao capítulo atual." });
  if (enemy.kind === "boss") {
    const chapter = CHAPTERS.find((candidate) => candidate.number === enemy.chapter);
    const requiredEnemies = chapter.enemies.filter((candidate) => candidate.kind !== "boss").map((candidate) => candidate.id);
    const defeatedRows = await db.select({ enemyCode: defeatedEncounters.enemyCode }).from(defeatedEncounters).where(eq(defeatedEncounters.saveId, save.id));
    const defeatedSet = new Set(defeatedRows.map((row) => row.enemyCode));
    if (requiredEnemies.some((code) => !defeatedSet.has(code))) {
      return res.status(409).json({ error: "Derrote os outros inimigos deste capítulo antes de enfrentar o chefe." });
    }
    const questCodes = getChapterSideQuests(enemy.chapter).map((quest) => `sidequest:${quest.id}:`);
    if (questCodes.some((prefix) => ![...defeatedSet].some((code) => code.startsWith(prefix)))) {
      return res.status(409).json({ error: "Decida o destino das duas missões opcionais deste capítulo antes do chefe (você pode recusá-las)." });
    }
  }
  if (save.hpCurrent <= 0) return res.status(409).json({ error: "Você está sem vida. Use um item de cura antes de lutar." });

  const [alreadyDefeated] = await db.select().from(defeatedEncounters).where(and(eq(defeatedEncounters.saveId, save.id), eq(defeatedEncounters.enemyCode, enemy.id)));
  if (alreadyDefeated) return res.status(409).json({ error: "Este inimigo já foi derrotado neste save." });

  const gearRows = await db.select({ name: items.name }).from(equippedItems)
    .innerJoin(items, eq(equippedItems.itemId, items.id)).where(eq(equippedItems.saveId, save.id));
  const gearStats = gearRows.reduce((total, row) => {
    const definition = ITEMS.find((item) => item.name === row.name);
    for (const [stat, value] of Object.entries(definition?.stats || {})) total[stat] = (total[stat] || 0) + value;
    return total;
  }, {});
  const strength = save.forca + (gearStats.forca || 0);
  const dexterity = save.destreza + (gearStats.destreza || 0);
  const resistance = save.resistencia + (gearStats.resistencia || 0);
  const level = Math.max(0, Math.floor((save.xpMax - 100) / 50));
  const playerAttack = 12 + strength * 2 + dexterity + (gearStats.inteligencia || 0) * 0.5 + level * 7 + Math.floor(Math.random() * 6);
  const playerDefense = Math.floor(resistance * 1.35 + level * 4 + (gearStats.agilidade || 0) * 0.5);
  let enemyHp = enemy.hp;
  let playerHp = save.hpCurrent;
  let rounds = 0;
  while (enemyHp > 0 && playerHp > 0 && rounds < 40) {
    rounds += 1;
    enemyHp -= playerAttack;
    if (enemyHp > 0) playerHp -= Math.max(1, enemy.attack + Math.floor(Math.random() * 5) - playerDefense);
  }
  const victory = enemyHp <= 0;
  if (!victory) {
    const [updated] = await db.update(saves).set({ hpCurrent: Math.max(1, playerHp), updatedAt: new Date(), lastPlayedAt: new Date() }).where(eq(saves.id, save.id)).returning();
    return res.json({ victory: false, enemy: { id: enemy.id, name: enemy.name, hp: enemy.hp, hpCurrent: Math.max(0, enemyHp), kind: enemy.kind }, rounds, damageTaken: save.hpCurrent - updated.hpCurrent, save: updated, message: "Você foi derrotado e precisou recuar. Nenhuma recompensa foi concedida." });
  }

  const [registered] = await db.insert(defeatedEncounters).values({ saveId: save.id, enemyCode: enemy.id }).onConflictDoNothing().returning();
  if (!registered) return res.status(409).json({ error: "Este inimigo já foi derrotado neste save." });

  const drops = [];
  for (const drop of enemy.drops || []) {
    if (Math.random() <= drop.chance) {
      const itemDef = getItemByCode(drop.item);
      if (!itemDef) continue;
      try {
        const result = await grantItem(save.id, itemDef, 1);
        drops.push({ code: itemDef.code, name: itemDef.name, granted: result.granted, reason: result.reason || null });
      } catch {
        drops.push({ code: itemDef.code, name: itemDef.name, granted: false, reason: "grant_failed" });
      }
    }
  }

  let xpCurrent = save.xpCurrent + enemy.xp;
  let xpMax = save.xpMax;
  let availablePoints = save.availablePoints;
  let levelsGained = 0;
  while (xpCurrent >= xpMax && levelsGained < 10) {
    xpCurrent -= xpMax;
    xpMax += 50;
    availablePoints += 3;
    levelsGained += 1;
  }
  const isBoss = enemy.kind === "boss";
  const nextChapter = isBoss ? Math.min(CHAPTERS.length, save.chapterCurrent + 1) : save.chapterCurrent;
  const [updated] = await db.update(saves).set({
    hpCurrent: Math.max(1, Math.min(save.hpMax + levelsGained * 12, playerHp + levelsGained * 12)),
    hpMax: save.hpMax + levelsGained * 12,
    energyCurrent: Math.min(save.energyMax + levelsGained * 5, save.energyCurrent + levelsGained * 5),
    energyMax: save.energyMax + levelsGained * 5,
    xpCurrent, xpMax, availablePoints,
    money: sql`${saves.money} + ${enemy.gold}`,
    chapterCurrent: nextChapter,
    chapterMax: CHAPTERS.length,
    completed: isBoss && save.chapterCurrent === CHAPTERS.length,
    updatedAt: new Date(), lastPlayedAt: new Date(),
  }).where(eq(saves.id, save.id)).returning();

  res.json({
    victory: true,
    enemy: { id: enemy.id, name: enemy.name, kind: enemy.kind, hp: enemy.hp, hpCurrent: 0 },
    rounds,
    rewards: { xp: enemy.xp, gold: enemy.gold, levelsGained },
    drops,
    chapterAdvanced: isBoss && nextChapter !== save.chapterCurrent,
    save: updated,
    message: isBoss ? "Chefe derrotado! A história avança." : "Inimigo derrotado! Recompensas adicionadas.",
  });
}

export async function useItem(req, res) {
  const inventoryId = Number(req.params.inventoryId);
  if (!Number.isSafeInteger(inventoryId) || inventoryId < 1) return res.status(400).json({ error: "ID de inventário inválido." });
  const [row] = await db.select({ inventoryId: inventoryItems.id, quantity: inventoryItems.quantity, itemId: items.id, name: items.name })
    .from(inventoryItems).innerJoin(items, eq(inventoryItems.itemId, items.id))
    .where(and(eq(inventoryItems.id, inventoryId), eq(inventoryItems.saveId, req.save.id)));
  if (!row) return res.status(404).json({ error: "Item não encontrado no inventário." });
  const definition = ITEMS.find((item) => item.name === row.name);
  if (!definition?.effect) return res.status(400).json({ error: "Este item não é consumível." });
  if (req.save.hpCurrent >= req.save.hpMax && req.save.energyCurrent >= req.save.energyMax) {
    return res.status(409).json({ error: "Sua vida e energia já estão completas." });
  }
  const hpCurrent = Math.min(req.save.hpMax, req.save.hpCurrent + (definition.effect.hp || 0));
  const energyCurrent = Math.min(req.save.energyMax, req.save.energyCurrent + (definition.effect.energy || 0));
  await db.update(saves).set({ hpCurrent, energyCurrent, updatedAt: new Date(), lastPlayedAt: new Date() }).where(eq(saves.id, req.save.id));
  if (row.quantity <= 1) await db.delete(inventoryItems).where(eq(inventoryItems.id, row.inventoryId));
  else await db.update(inventoryItems).set({ quantity: row.quantity - 1 }).where(eq(inventoryItems.id, row.inventoryId));
  const [updatedSave] = await db.select().from(saves).where(eq(saves.id, req.save.id));
  res.json({ message: `${definition.name} utilizado.`, save: updatedSave });
}


function sideQuestStatusCode(questId, status) {
  return `sidequest:${questId}:${status}`;
}

export async function listSideQuests(req, res) {
  const chapter = Number(req.params.chapterNumber ?? req.save.chapterCurrent);
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > CHAPTERS.length) {
    return res.status(400).json({ error: "Capítulo inválido." });
  }
  const rows = await db.select({ enemyCode: defeatedEncounters.enemyCode })
    .from(defeatedEncounters).where(eq(defeatedEncounters.saveId, req.save.id));
  const statuses = new Map();
  for (const row of rows) {
    const match = /^sidequest:(c\d{2}_q[12]):(success|failed|declined)$/.exec(row.enemyCode);
    if (match) statuses.set(match[1], match[2]);
  }
  res.json(getChapterSideQuests(chapter).map(({ id, chapter: chapterNumber, chapterTitle, title, description, attribute, difficulty, successText, failureText, xp, gold, rewardItem }) => ({
    id, chapter: chapterNumber, chapterTitle, title, description, attribute, difficulty,
    successText, failureText, xp, gold, rewardItem, status: statuses.get(id) ?? "available",
  })));
}

export async function resolveSideQuest(req, res) {
  const save = req.save;
  const quest = getSideQuest(req.params.questId);
  if (!quest) return res.status(404).json({ error: "Missão opcional não encontrada." });
  if (quest.chapter !== save.chapterCurrent) return res.status(409).json({ error: "Essa missão não pertence ao capítulo atual." });
  const action = req.body?.action;
  if (!["accept", "decline"].includes(action)) return res.status(400).json({ error: "Ação inválida. Use accept ou decline." });

  const existingRows = await db.select({ enemyCode: defeatedEncounters.enemyCode })
    .from(defeatedEncounters).where(eq(defeatedEncounters.saveId, save.id));
  const prefix = `sidequest:${quest.id}:`;
  if (existingRows.some((row) => row.enemyCode.startsWith(prefix))) {
    return res.status(409).json({ error: "Esta missão já foi resolvida ou recusada." });
  }

  if (action === "decline") {
    await db.insert(defeatedEncounters).values({ saveId: save.id, enemyCode: sideQuestStatusCode(quest.id, "declined") }).onConflictDoNothing();
    return res.json({ questId: quest.id, status: "declined", message: "Missão recusada. Você pode continuar a campanha sem penalidade." });
  }

  const attributeValue = Number(save[quest.attribute] ?? 0);
  const chance = Math.max(10, Math.min(95, 30 + 6 * attributeValue - quest.difficulty));
  const success = Math.random() * 100 < chance;
  const status = success ? "success" : "failed";
  const [registered] = await db.insert(defeatedEncounters)
    .values({ saveId: save.id, enemyCode: sideQuestStatusCode(quest.id, status) })
    .onConflictDoNothing().returning();
  if (!registered) return res.status(409).json({ error: "Esta missão já foi resolvida." });

  let updatedSave = save;
  let reward = null;
  if (success) {
    let xpCurrent = save.xpCurrent + quest.xp;
    let xpMax = save.xpMax;
    let availablePoints = save.availablePoints;
    let levelsGained = 0;
    while (xpCurrent >= xpMax && levelsGained < 10) {
      xpCurrent -= xpMax;
      xpMax += 50;
      availablePoints += 3;
      levelsGained += 1;
    }
    await db.update(saves).set({
      xpCurrent, xpMax, availablePoints,
      hpMax: save.hpMax + levelsGained * 12,
      hpCurrent: Math.min(save.hpMax + levelsGained * 12, save.hpCurrent + levelsGained * 12),
      energyMax: save.energyMax + levelsGained * 5,
      energyCurrent: Math.min(save.energyMax + levelsGained * 5, save.energyCurrent + levelsGained * 5),
      money: sql`${saves.money} + ${quest.gold}`,
      updatedAt: new Date(), lastPlayedAt: new Date(),
    }).where(eq(saves.id, save.id));
    const itemDef = getItemByCode(quest.rewardItem);
    if (itemDef) {
      try {
        const granted = await grantItem(save.id, itemDef, 1);
        reward = { xp: quest.xp, gold: quest.gold, item: itemDef.name, itemGranted: granted.granted, itemReason: granted.reason ?? null, levelsGained };
      } catch {
        reward = { xp: quest.xp, gold: quest.gold, item: itemDef.name, itemGranted: false, itemReason: "grant_failed", levelsGained };
      }
    }
    const [freshSave] = await db.select().from(saves).where(eq(saves.id, save.id));
    updatedSave = freshSave;
  }
  res.json({
    questId: quest.id, status, chance,
    message: success ? quest.successText : quest.failureText,
    reward, save: updatedSave,
  });
}
