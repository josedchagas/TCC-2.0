import { z } from "zod";

const ITEM_TYPES = ["weapon", "armor", "consumable", "accessory", "material"];

export const createItemSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório.").max(64),
  type: z.enum(ITEM_TYPES, { errorMap: () => ({ message: `type precisa ser um de: ${ITEM_TYPES.join(", ")}` }) }),
  iconUrl: z.string().url("iconUrl precisa ser uma URL válida.").optional().nullable(),
  description: z.string().max(500).optional().nullable(),
});

// No update, todos os campos são opcionais (só manda o que quer mudar).
export const updateItemSchema = createItemSchema.partial();