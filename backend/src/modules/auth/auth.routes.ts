import { Router } from "express";
import * as authController from "./auth.controller";
import { validate } from "../../middleware/validation.middleware";
import { authenticate } from "../../middleware/auth.middleware";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema
} from "./auth.validation";

const router = Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post("/logout", authController.logout);
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  authController.forgotPassword
);
router.get("/me", authenticate, authController.getMe);

export default router;

