import { Router } from "express";
import { UserRole } from "@prisma/client";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import {
  createProductHandler,
  getProductsHandler,
  getProductByIdHandler,
  updateProductHandler,
  setProductStatusHandler,
  createVariantHandler,
  getVariantsHandler,
  updateVariantHandler,
  setVariantStatusHandler,
  deleteVariantHandler
} from "./product.controller";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Product routes
router.get(
  "/",
  authorize(UserRole.ADMIN, UserRole.STAFF, UserRole.CUSTOMER),
  getProductsHandler
);

router.post(
  "/",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  createProductHandler
);

router.get(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.STAFF, UserRole.CUSTOMER),
  getProductByIdHandler
);

router.put(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  updateProductHandler
);

router.patch(
  "/:id/status",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  setProductStatusHandler
);

// Variant routes
router.post(
  "/:id/variants",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  createVariantHandler
);

router.get(
  "/:id/variants",
  authorize(UserRole.ADMIN, UserRole.STAFF, UserRole.CUSTOMER),
  getVariantsHandler
);

router.put(
  "/:id/variants/:variantId",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  updateVariantHandler
);

router.patch(
  "/:id/variants/:variantId/status",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  setVariantStatusHandler
);

router.delete(
  "/:id/variants/:variantId",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  deleteVariantHandler
);

export default router;
