import { Router } from "express";
import {
  listEquipment,
  equipItem,
  swapEquippedItem,
  unequipItem,
} from "../controllers/equipment.controller.js";
import { equipSchema, swapEquipSchema } from "../controllers/equipment.schemas.js";
import { validate } from "../middlewares/validate.js";
import { asyncHandler } from "../middlewares/errorHandler.js";

const router = Router({ mergeParams: true });

router.get("/", asyncHandler(listEquipment));
router.post("/", validate(equipSchema), asyncHandler(equipItem));
router.put("/:id", validate(swapEquipSchema), asyncHandler(swapEquippedItem));
router.delete("/:id", asyncHandler(unequipItem));

export default router;