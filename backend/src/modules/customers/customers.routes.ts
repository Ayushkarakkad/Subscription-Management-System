import { Router } from "express";
import { UserRole } from "@prisma/client";
import * as customersController from "./customers.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validation.middleware";
import {
  createCustomerSchema,
  updateCustomerSchema
} from "./customers.validation";

const router = Router();

router.use(authenticate);

// Staff and Admin can view all; Customer can only get own via controller check
router.get(
  "/",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  customersController.list
);

router.post(
  "/",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  validate(createCustomerSchema),
  customersController.create
);

router.get("/:id", customersController.getById);

router.put(
  "/:id",
  validate(updateCustomerSchema),
  customersController.update
);

export default router;

