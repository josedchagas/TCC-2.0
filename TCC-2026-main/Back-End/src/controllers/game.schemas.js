import { z } from "zod";
export const buyItemSchema = z.object({ itemCode: z.string().min(1).max(64), quantity: z.number().int().min(1).max(99).default(1) }).strict();
