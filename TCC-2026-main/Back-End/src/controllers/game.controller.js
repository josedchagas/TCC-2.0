import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { defeatedEncounters, equippedItems, inventoryItems, items, saves } from "../db/schema.js";
import { CHAPTERS, ITEMS, SHOPS, getEnemyById, getItemByCode } from "../game/Content.js";
import { SIDE_QUESTS, getChapterSideQuests, getSideQuest } from "../game/SideQuests.js";

const MAX_INVENTORY_SLOTS = 16;
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
  if (req.save.completed || req.save.hpCurrent <= 0 || req.save.energyCurrent <= 0) {
    return res.status(409).json({ error: "Este save foi encerrado e não pode realizar compras." });
  }
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
  if (save.completed) return res.status(409).json({ error: "Este save já foi encerrado e não pode continuar." });
  if (save.hpCurrent <= 0 || save.energyCurrent <= 0) {
    const [lostSave] = await db.update(saves).set({ completed: true, updatedAt: new Date(), lastPlayedAt: new Date() })
      .where(eq(saves.id, save.id)).returning();
    return res.json({
      victory: false, permanentDeath: true, enemy: { id: enemy.id, name: enemy.name, kind: enemy.kind },
      rounds: 0, damageTaken: 0, save: lostSave,
      message: "DERROTA PERMANENTE: a vida ou o vigor chegou a zero. Este save foi encerrado."
    });
  }
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

  const [alreadyDefeated] = await db.select().from(defeatedEncounters).where(and(eq(defeatedEncounters.saveId, save.id), eq(defeatedEncounters.enemyCode, enemy.id)));
  if (alreadyDefeated) return res.status(409).json({ error: "Este inimigo já foi derrotado neste save." });

  const submittedRolls = Array.isArray(req.body?.rolls) ? req.body.rolls : [];
  if (submittedRolls.length > 40 || submittedRolls.some((roll) => !Number.isInteger(roll) || roll < 1 || roll > 20)) {
    return res.status(400).json({ error: "As rolagens devem ser números inteiros de 1 a 20, com no máximo 40 turnos." });
  }

  const gearRows = await db.select({ name: items.name, slot: equippedItems.slot })
    .from(equippedItems).innerJoin(items, eq(equippedItems.itemId, items.id))
    .where(eq(equippedItems.saveId, save.id));
  const gearStats = gearRows.reduce((total, row) => {
    const definition = ITEMS.find((item) => item.name === row.name);
    for (const [stat, value] of Object.entries(definition?.stats || {})) total[stat] = (total[stat] || 0) + value;
    return total;
  }, {});
  const strength = save.forca + (gearStats.forca || 0);
  const resistance = save.resistencia + (gearStats.resistencia || 0);
  const weaponDamage = gearRows.reduce((total, row) => {
    if (row.slot !== "weapon") return total;
    return total + (ITEMS.find((item) => item.name === row.name)?.damage || 0);
  }, 0);
  const armorHp = gearRows.reduce((total, row) => {
    if (!["helmet", "chest", "pants", "boots", "shield"].includes(row.slot)) return total;
    return total + (ITEMS.find((item) => item.name === row.name)?.armorHp || 0);
  }, 0);
  const baseLifeBonus = armorHp + resistance;
  let playerMaxHp = 100 + baseLifeBonus;
  let enemyHp = enemy.hp;
  let playerHp = playerMaxHp;
  const turns = [];

  // Rolagens inimigas e testes críticos são estáveis ao revalidar a sequência.
  const seededRoll = (label, turn) => {
    const seed = `${save.id}:${enemy.id}:${turn}:${label}`;
    let hash = 0;
    for (const character of seed) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
    return (hash % 100) + 1;
  };
  const enemyRollForTurn = (turn) => (seededRoll("attack", turn) % 20) + 1;
  const critByClass = { Guerreiro: 10, Arqueira: 15, Maga: 12, Ladino: 20 };
  const playerCritChance = critByClass[save.classRole] ?? 10;
  const enemyCritChance = enemy.kind === "boss" ? 18 : enemy.kind === "elite" ? 13 : 8;
  // Ajuste de dificuldade: inimigos comuns pressionam, elites punem erros e chefes são ameaças reais.
  const enemyDamageMultiplier = enemy.kind === "boss" ? 1.9 : enemy.kind === "elite" ? 1.7 : 1.5;

  for (let index = 0; index < 40 && submittedRolls.length > 0 && enemyHp > 0 && playerHp > 0; index += 1) {
    const round = index + 1;
    // A única rolagem escolhida pelo jogador determina seus ataques em toda a simulação.
    const playerRoll = submittedRolls[0];
    const playerMultiplier = playerRoll / 10;
    // A rolagem do jogador altera o ataque, nunca a vida atual.
    const playerCritRoll = seededRoll(`player-crit-${playerRoll}`, round);
    const playerCritical = playerRoll === 20 || playerCritRoll <= playerCritChance;
    const playerBaseDamage = Math.max(1, Math.floor(strength + weaponDamage * playerMultiplier));
    const playerDamage = Math.max(1, Math.floor(playerBaseDamage * (playerCritical ? 1.5 : 1)));
    enemyHp = Math.max(0, enemyHp - playerDamage);
    const turn = { round, playerRoll, playerMultiplier: Number(playerMultiplier.toFixed(1)), playerCritChance, playerCritRoll, playerCritical, playerMaxHp, playerBaseDamage, playerDamage, enemyHp, enemyRoll: null, enemyCritChance, enemyCritRoll: null, enemyCritical: false, enemyDamage: 0, playerHp };
    if (enemyHp > 0) {
      const enemyRoll = enemyRollForTurn(round);
      const enemyMultiplier = enemyRoll / 10;
      const enemyCritRoll = seededRoll("enemy-crit", round);
      const enemyCritical = enemyCritRoll <= enemyCritChance;
      const enemyBaseDamage = Math.max(1, Math.floor(enemy.attack * enemyMultiplier * enemyDamageMultiplier));
      const enemyDamage = Math.max(1, Math.floor(enemyBaseDamage * (enemyCritical ? 1.25 : 1)));
      playerHp = Math.max(0, playerHp - enemyDamage);
      turn.enemyRoll = enemyRoll;
      turn.enemyMultiplier = Number(enemyMultiplier.toFixed(1));
      turn.enemyCritRoll = enemyCritRoll;
      turn.enemyCritical = enemyCritical;
      turn.enemyBaseDamage = enemyBaseDamage;
      turn.enemyDamage = enemyDamage;
      turn.playerHp = playerHp;
    }
    turns.push(turn);
  }

  const rounds = turns.length;
  const victory = enemyHp <= 0;
  const combat = {
    playerHp, playerMaxHp, enemyHp, enemyMaxHp: enemy.hp,
    rounds, turns, weaponDamage, armorHp, strength, resistance, playerCritChance, enemyCritChance,
  };

  if (submittedRolls.length === 0) {
    return res.json({
      inProgress: true,
      victory: false,
      enemy: { id: enemy.id, name: enemy.name, hp: enemy.hp, hpCurrent: enemyHp, kind: enemy.kind },
      combat,
    });
  }
  if (!victory && playerHp > 0) {
    playerHp = 0;
    combat.playerHp = 0;
  }
  if (!victory) {
    // A derrota custa exatamente um coração; o dano calculado durante o combate não é descontado.
    const remainingHp = Math.max(0, save.hpCurrent - 1);
    const permanentDeath = remainingHp <= 0 || save.energyCurrent <= 0;
    // O encontro fica resolvido mesmo com a retirada, permitindo que a narrativa avance.
    await db.insert(defeatedEncounters).values({ saveId: save.id, enemyCode: enemy.id }).onConflictDoNothing();
    const isBoss = enemy.kind === "boss";
    const nextChapter = isBoss && !permanentDeath ? Math.min(CHAPTERS.length, save.chapterCurrent + 1) : save.chapterCurrent;
    const [updated] = await db.update(saves).set({
      hpCurrent: remainingHp,
      completed: permanentDeath,
      chapterCurrent: nextChapter,
      chapterMax: CHAPTERS.length,
      updatedAt: new Date(),
      lastPlayedAt: new Date(),
    }).where(eq(saves.id, save.id)).returning();
    return res.json({
      victory: false, permanentDeath, chapterAdvanced: isBoss && !permanentDeath && nextChapter !== save.chapterCurrent,
      enemy: { id: enemy.id, name: enemy.name, hp: enemy.hp, hpCurrent: Math.max(0, enemyHp), kind: enemy.kind },
      rounds, damageTaken: 1, combat, save: updated,
      message: permanentDeath
        ? "DERROTA PERMANENTE: você perdeu seu último coração ou estava sem vigor. Este save foi encerrado."
        : isBoss
          ? "Você perdeu o confronto e recuou. O chefe permanece vivo, mas você encontrou uma rota para seguir adiante. Nenhuma recompensa foi concedida."
          : "Você perdeu o confronto e recuou. A criatura permanece viva, mas encontrou uma abertura para continuar a jornada. Nenhuma recompensa foi concedida."
    });
  }

  const [registered] = await db.insert(defeatedEncounters).values({ saveId: save.id, enemyCode: enemy.id }).onConflictDoNothing().returning();
  if (!registered) return res.status(409).json({ error: "Este inimigo já foi derrotado neste save." });

  const drops = [];
  for (const drop of enemy.drops || []) {
    if (Math.random() <= drop.chance) {
      const itemDef = getItemByCode(drop.item);
      if (!itemDef) continue;
      const pendingCode = `pending-drop:${enemy.id}:${itemDef.code}`;
      await db.insert(defeatedEncounters).values({ saveId: save.id, enemyCode: pendingCode }).onConflictDoNothing();
      drops.push({ code: itemDef.code, name: itemDef.name, granted: false, pending: true });
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
    // Corações (moral) e vigor têm capacidade fixa de 5; subir de nível não altera esses limites.
    // O dano recebido durante a simulação não reduz corações ao vencer.
    hpCurrent: Math.min(5, Math.max(1, save.hpCurrent)),
    hpMax: 5,
    energyCurrent: Math.min(5, save.energyCurrent),
    energyMax: 5,
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
    combat,
    rewards: { xp: enemy.xp, gold: enemy.gold, levelsGained },
    drops,
    chapterAdvanced: isBoss && nextChapter !== save.chapterCurrent,
    save: updated,
    message: isBoss ? "Chefe derrotado! A história avança." : "Inimigo derrotado! Recompensas adicionadas.",
  });
}

export async function useItem(req, res) {
  if (req.save.completed || req.save.hpCurrent <= 0 || req.save.energyCurrent <= 0) {
    return res.status(409).json({ error: "Este save foi encerrado por derrota permanente; não é possível usar itens nele." });
  }
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
  if (req.save.completed || req.save.hpCurrent <= 0 || req.save.energyCurrent <= 0) {
    return res.status(409).json({ error: "Este save foi encerrado por derrota permanente; não é possível continuar missões." });
  }
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
      // Corações (moral) e vigor permanecem com limite fixo de 5, mesmo ao subir de nível.
      hpMax: 5,
      hpCurrent: Math.min(5, save.hpCurrent),
      energyMax: 5,
      energyCurrent: Math.min(5, save.energyCurrent),
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

export async function resolveBattleDrop(req, res) {
  const save = req.save;
  const enemy = getEnemyById(req.params.enemyId);
  const itemCode = String(req.params.itemCode || "");
  const action = String(req.params.action || "");
  if (!enemy) return res.status(404).json({ error: "Inimigo não encontrado." });
  if (!["claim", "discard"].includes(action)) return res.status(400).json({ error: "Ação de drop inválida." });
  const itemDef = getItemByCode(itemCode);
  if (!itemDef || !(enemy.drops || []).some((drop) => drop.item === itemCode)) {
    return res.status(400).json({ error: "Este item não pertence à lista de drops do inimigo." });
  }
  const pendingCode = `pending-drop:${enemy.id}:${itemCode}`;
  const [pending] = await db.select().from(defeatedEncounters)
    .where(and(eq(defeatedEncounters.saveId, save.id), eq(defeatedEncounters.enemyCode, pendingCode)));
  if (!pending) return res.status(409).json({ error: "Este drop já foi coletado ou descartado." });
  if (action === "claim") {
    const grant = await grantItem(save.id, itemDef, 1);
    if (!grant.granted) {
      return res.status(409).json({ error: grant.reason === "inventory_full" ? "Inventário cheio. Libere um espaço antes de pegar este drop." : "Não foi possível adicionar o item ao inventário." });
    }
  }
  await db.delete(defeatedEncounters).where(eq(defeatedEncounters.id, pending.id));
  return res.json({ claimed: action === "claim", discarded: action === "discard", item: itemDef.name });
}
