import { Router } from "express";
import { UserRole } from "@prisma/client";
import * as usersController from "./users.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validation.middleware";
import { createUserSchema, updateUserSchema } from "./users.validation";

const router = Router();

router.use(authenticate);

// Admin only user management
router.get("/", authorize(UserRole.ADMIN), usersController.list);
router.post(
  "/",
  authorize(UserRole.ADMIN),
  validate(createUserSchema),
  usersController.create
);
router.get("/:id", authorize(UserRole.ADMIN), usersController.getById);
router.put(
  "/:id",
  authorize(UserRole.ADMIN),
  validate(updateUserSchema),
  usersController.update
);
router.delete("/:id", authorize(UserRole.ADMIN), usersController.remove);

export default router;

