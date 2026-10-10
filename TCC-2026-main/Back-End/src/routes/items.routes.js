import { Router } from "express";
import { listItems, getItem, createItem, updateItem, deleteItem } from "../controllers/items.controller.js";
import { createItemSchema, updateItemSchema } from "../controllers/items.schemas.js";
import { validate } from "../middlewares/validate.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import { asyncHandler } from "../middlewares/errorHandler.js";

const router = Router();
router.get("/", asyncHandler(listItems));
router.get("/:id", asyncHandler(getItem));
// Somente administradores podem alterar o catálogo global compartilhado.
router.post("/", requireAuth, asyncHandler(requireAdmin), validate(createItemSchema), asyncHandler(createItem));
router.put("/:id", requireAuth, asyncHandler(requireAdmin), validate(updateItemSchema), asyncHandler(updateItem));
router.delete("/:id", requireAuth, asyncHandler(requireAdmin), asyncHandler(deleteItem));
export default router;
