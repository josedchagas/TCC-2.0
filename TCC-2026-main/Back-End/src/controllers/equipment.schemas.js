import { z } from "zod";

// Mesmos slots do CharacterPanel no front.
export const EQUIPMENT_SLOTS = ["helmet", "weapon", "chest", "pants", "shield", "boots", "ring"];

export const equipSchema = z.object({
  itemId: z.number().int().positive(),
  slot: z.enum(EQUIPMENT_SLOTS, {
    errorMap: () => ({ message: `slot precisa ser um de: ${EQUIPMENT_SLOTS.join(", ")}` }),
  }),
});

// Trocar o item que está num slot (o slot em si não muda).
export const swapEquipSchema = z.object({
  itemId: z.number().int().positive(),
});