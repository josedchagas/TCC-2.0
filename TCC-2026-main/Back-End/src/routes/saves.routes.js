import { Router } from "express";
import { listSaves, getSave, createSave, updateSave, spendPoint, deleteSave } from "../controllers/saves.controller.js";
import { createSaveSchema, updateSaveSchema, spendPointSchema } from "../controllers/saves.schemas.js";
import { validate } from "../middlewares/validate.js";
import { requireAuth } from "../middlewares/auth.js";
import { ownsSave } from "../middlewares/ownsSave.js";
import { asyncHandler } from "../middlewares/errorHandler.js";
import inventoryRoutes from "./inventory.routes.js";
import equipmentRoutes from "./equipment.routes.js";
import gameActionsRoutes from "./game-actions.routes.js";

const router = Router();
router.use(requireAuth);
router.get("/", asyncHandler(listSaves));
router.post("/", validate(createSaveSchema), asyncHandler(createSave));
router.get("/:id", asyncHandler(ownsSave("id")), asyncHandler(getSave));
router.put("/:id", asyncHandler(ownsSave("id")), validate(updateSaveSchema), asyncHandler(updateSave));
router.post("/:id/actions/spend-point", asyncHandler(ownsSave("id")), validate(spendPointSchema), asyncHandler(spendPoint));
router.delete("/:id", asyncHandler(ownsSave("id")), asyncHandler(deleteSave));

router.use("/:saveId/inventory", asyncHandler(ownsSave("saveId")), inventoryRoutes);
router.use("/:saveId/equipment", asyncHandler(ownsSave("saveId")), equipmentRoutes);

// Rotas de ações do jogo: encontros, batalhas, loja e uso de itens.
router.use("/:saveId", asyncHandler(ownsSave("saveId")), gameActionsRoutes);

export default router;
