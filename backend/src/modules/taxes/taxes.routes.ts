import { Router } from "express";
import { UserRole } from "@prisma/client";
import * as taxesController from "./taxes.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validation.middleware";
import {
  createTaxSchema,
  updateTaxSchema,
  updateStatusSchema
} from "./taxes.validation";

const router = Router();

router.use(authenticate);

// Staff & Admin can manage and view taxes (used for quotations and invoices)
router.get(
  "/",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  taxesController.list
);

router.get(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  taxesController.getById
);

router.post(
  "/",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  validate(createTaxSchema),
  taxesController.create
);

router.put(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  validate(updateTaxSchema),
  taxesController.update
);

router.patch(
  "/:id/status",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  validate(updateStatusSchema),
  taxesController.setStatus
);

export default router;

