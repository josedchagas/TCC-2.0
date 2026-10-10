import { z } from "zod";

export const addInventorySchema = z.object({
  itemId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(99).default(1),
});

export const updateInventorySchema = z.object({
  // Pra tirar o item do inventário use DELETE; aqui a quantidade mínima é 1.
  quantity: z.number().int().min(1).max(99),
});