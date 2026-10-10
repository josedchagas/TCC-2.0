import { Router } from "express";
import { register, login, guest, logout, me } from "../controllers/auth.controller.js";
import { registerSchema, loginSchema } from "../controllers/auth.schemas.js";
import { validate } from "../middlewares/validate.js";
import { requireAuth, optionalAuth } from "../middlewares/auth.js";
import { asyncHandler } from "../middlewares/errorHandler.js";

const router = Router();
router.post("/register", validate(registerSchema), asyncHandler(register));
router.post("/login", validate(loginSchema), asyncHandler(login));
router.post("/guest", optionalAuth, asyncHandler(guest));
router.post("/logout", asyncHandler(logout));
router.get("/me", requireAuth, asyncHandler(me));
export default router;
