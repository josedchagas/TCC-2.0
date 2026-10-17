import { Router } from "express";
import { getCampaign, getChapter, getCatalog, getShop } from "../controllers/game.controller.js";
import { asyncHandler } from "../middlewares/errorHandler.js";
const router = Router();
router.get("/campaign", asyncHandler(getCampaign));
router.get("/chapters/:chapterNumber", asyncHandler(getChapter));
router.get("/items", asyncHandler(getCatalog));
router.get("/shops/:chapterNumber", asyncHandler(getShop));
export default router;
