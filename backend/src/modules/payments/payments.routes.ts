import { Router } from "express";
import { UserRole } from "@prisma/client";
import * as paymentsController from "./payments.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validation.middleware";
import { recordPaymentSchema } from "./payments.validation";

const router = Router();

router.use(authenticate);

router.get("/", paymentsController.list);
router.get("/:id", paymentsController.getById);

// Staff and Admin can record authorized payments
router.post(
  "/",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  validate(recordPaymentSchema),
  paymentsController.record
);

export default router;

