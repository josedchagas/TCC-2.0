import { z } from "zod";

export const CHARACTER_IDS = ["elyra", "bram", "sora", "toren"];

// O cliente escolhe apenas personagem e slot. Os atributos são definidos no servidor.
export const createSaveSchema = z.object({
  slotNumber: z.number().int().min(1).max(8),
  characterId: z.enum(CHARACTER_IDS),
}).strict();

// PUT não pode alterar XP, dinheiro, vida, energia, capítulo ou atributos.
export const updateSaveSchema = z.object({
  characterName: z.string().trim().min(1).max(32),
}).strict();

export const spendPointSchema = z.object({
  stat: z.enum(["forca", "destreza", "inteligencia", "resistencia", "agilidade"]),
}).strict();
