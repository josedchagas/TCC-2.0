import { Router } from "express";
import {
  listInventory,
  addToInventory,
  updateInventoryItem,
  removeFromInventory,
  sellInventoryItem,
} from "../controllers/inventory.controller.js";
import {
  addInventorySchema,
  updateInventorySchema,
} from "../controllers/inventory.schemas.js";
import { validate } from "../middlewares/validate.js";
import { asyncHandler } from "../middlewares/errorHandler.js";

// mergeParams deixa essa rota enxergar o :saveId definido no saves.routes.js.
// O requireAuth e o ownsSave já rodaram antes (no saves.routes.js).
const router = Router({ mergeParams: true });

router.get("/", asyncHandler(listInventory));
router.post("/", validate(addInventorySchema), asyncHandler(addToInventory));
router.put("/:id", validate(updateInventorySchema), asyncHandler(updateInventoryItem));
router.delete("/:id", asyncHandler(removeFromInventory));
router.post("/:id/sell", asyncHandler(sellInventoryItem));

export default router;