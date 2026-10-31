import { Router } from "express";
import { UserRole } from "@prisma/client";
import * as discountsController from "./discounts.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validation.middleware";
import {
  createDiscountSchema,
  updateDiscountSchema,
  updateStatusSchema,
  validateDiscountSchema,
  addDiscountProductSchema
} from "./discounts.validation";

const router = Router();

router.use(authenticate);

// Validation endpoint can be used by all users during checkout/quotation creation
router.post(
  "/validate",
  validate(validateDiscountSchema),
  discountsController.validate
);

router.get("/", discountsController.list);
router.get("/:id", discountsController.getById);

// Staff and Admin can create and configure discounts
router.post(
  "/",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  validate(createDiscountSchema),
  discountsController.create
);

router.put(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  validate(updateDiscountSchema),
  discountsController.update
);

router.patch(
  "/:id/status",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  validate(updateStatusSchema),
  discountsController.setStatus
);

// Discount products
router.get("/:id/products", discountsController.getProducts);

router.post(
  "/:id/products",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  validate(addDiscountProductSchema),
  discountsController.addProduct
);

router.delete(
  "/:id/products/:productId",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  discountsController.removeProduct
);

export default router;

