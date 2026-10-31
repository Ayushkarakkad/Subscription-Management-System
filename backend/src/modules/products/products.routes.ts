import { Router } from "express";
import { UserRole } from "@prisma/client";
import * as productsController from "./products.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validation.middleware";
import {
  createProductSchema,
  updateProductSchema,
  updateStatusSchema,
  createVariantSchema,
  updateVariantSchema
} from "./products.validation";

const router = Router();

router.use(authenticate);

// List & view available to all authenticated roles
router.get("/", productsController.list);
router.get("/:id", productsController.getById);

// Admin & Staff can create/update products
router.post(
  "/",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  validate(createProductSchema),
  productsController.create
);

router.put(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  validate(updateProductSchema),
  productsController.update
);

router.patch(
  "/:id/status",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  validate(updateStatusSchema),
  productsController.setStatus
);

// Variants
router.get("/:id/variants", productsController.listVariants);

router.post(
  "/:id/variants",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  validate(createVariantSchema),
  productsController.createVariant
);

router.put(
  "/:id/variants/:variantId",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  validate(updateVariantSchema),
  productsController.updateVariant
);

router.patch(
  "/:id/variants/:variantId/status",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  validate(updateStatusSchema),
  productsController.setVariantStatus
);

router.delete(
  "/:id/variants/:variantId",
  authorize(UserRole.ADMIN),
  productsController.deleteVariant
);

export default router;

