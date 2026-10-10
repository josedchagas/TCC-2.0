import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  timestamp,
  unique,
  boolean,
} from "drizzle-orm/pg-core";

// Quem joga (login).
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 32 }).notNull().unique(),
  // Contas anônimas não possuem e-mail/senha; PostgreSQL permite vários NULLs em UNIQUE.
  email: varchar("email", { length: 255 }).unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  role: varchar("role", { length: 16 }).default("player").notNull(),
  isAnonymous: boolean("is_anonymous").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Cada uma das 8 runs possíveis por usuário (a tela de "Continuar").
export const saves = pgTable(
  "saves",
  {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  slotNumber: integer("slot_number").notNull(), // 1 a 8

  characterName: varchar("character_name", { length: 32 }).notNull(),
  classRole: varchar("class_role", { length: 32 }).notNull(), // ex: "Arqueira"

  chapterCurrent: integer("chapter_current").default(1).notNull(),
  chapterMax: integer("chapter_max").default(1).notNull(),

  xpCurrent: integer("xp_current").default(0).notNull(),
  xpMax: integer("xp_max").default(100).notNull(),
  hpCurrent: integer("hp_current").default(5).notNull(),
  hpMax: integer("hp_max").default(5).notNull(),
  energyCurrent: integer("energy_current").default(5).notNull(),
  energyMax: integer("energy_max").default(5).notNull(),
  money: integer("money").default(0).notNull(),

  availablePoints: integer("available_points").default(0).notNull(),
  forca: integer("forca").default(0).notNull(),
  destreza: integer("destreza").default(0).notNull(),
  inteligencia: integer("inteligencia").default(0).notNull(),
  resistencia: integer("resistencia").default(0).notNull(),
  agilidade: integer("agilidade").default(0).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastPlayedAt: timestamp("last_played_at").defaultNow().notNull(),
  },
  (table) => ({
    // Um usuário não pode ter dois saves no mesmo slot.
    uniqueUserSlot: unique("saves_user_slot_unique").on(table.userId, table.slotNumber),
  })
);

// Catálogo de itens que existem no jogo (armas, poções, equipamentos, etc).
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 64 }).notNull(),
  type: varchar("type", { length: 32 }).notNull(), // "weapon" | "armor" | "consumable" | ...
  iconUrl: text("icon_url"),
  description: text("description"),
});

// Itens dentro do inventário de um save (os 8 slots de inventário).
export const inventoryItems = pgTable(
  "inventory_items",
  {
    id: serial("id").primaryKey(),
    saveId: integer("save_id")
      .notNull()
      .references(() => saves.id, { onDelete: "cascade" }),
    itemId: integer("item_id")
      .notNull()
      .references(() => items.id),
    quantity: integer("quantity").default(1).notNull(),
  },
  (table) => ({
    // O mesmo item não aparece duas vezes no mesmo inventário (soma a quantidade).
    uniqueSaveItem: unique("inventory_save_item_unique").on(table.saveId, table.itemId),
  })
);

// Itens equipados de um save (elmo, arma, peito, calça, escudo, botas, anéis).
export const equippedItems = pgTable("equipped_items", {
  id: serial("id").primaryKey(),
  saveId: integer("save_id")
    .notNull()
    .references(() => saves.id, { onDelete: "cascade" }),
  itemId: integer("item_id")
    .notNull()
    .references(() => items.id),
  slot: varchar("slot", { length: 16 }).notNull(), // "helmet" | "weapon" | "chest" | "pants" | "shield" | "boots" | "ring"
});