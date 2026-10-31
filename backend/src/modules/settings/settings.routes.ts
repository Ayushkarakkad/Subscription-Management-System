import { Router } from "express";
import { UserRole } from "@prisma/client";
import * as settingsController from "./settings.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";

const router = Router();

router.use(authenticate);

// Profile
router.get("/profile", settingsController.getProfile);
router.put("/profile", settingsController.updateProfile);
router.post("/change-password", settingsController.changePassword);

// System Settings (Admin only)
router.get("/system", authorize(UserRole.ADMIN), settingsController.getSystemSettings);
router.put("/system", authorize(UserRole.ADMIN), settingsController.updateSystemSettings);

export default router;

