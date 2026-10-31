import { Router } from "express";
import { UserRole } from "@prisma/client";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import {
  createDiscountHandler,
  getDiscountsHandler,
  getDiscountByIdHandler,
  updateDiscountHandler,
  setDiscountStatusHandler,
  associateProductsHandler,
  getDiscountProductsHandler,
  removeProductFromDiscountHandler,
  validateDiscountHandler
} from "./discount.controller";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Discount calculation/validation endpoint
router.post(
  "/validate",
  authorize(UserRole.ADMIN, UserRole.STAFF, UserRole.CUSTOMER),
  validateDiscountHandler
);

// Discount management
router.get(
  "/",
  authorize(UserRole.ADMIN, UserRole.STAFF, UserRole.CUSTOMER),
  getDiscountsHandler
);

router.post(
  "/",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  createDiscountHandler
);

router.get(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.STAFF, UserRole.CUSTOMER),
  getDiscountByIdHandler
);

router.put(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  updateDiscountHandler
);

router.patch(
  "/:id/status",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  setDiscountStatusHandler
);

// Product association routes
router.post(
  "/:id/products",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  associateProductsHandler
);

router.get(
  "/:id/products",
  authorize(UserRole.ADMIN, UserRole.STAFF, UserRole.CUSTOMER),
  getDiscountProductsHandler
);

router.delete(
  "/:id/products/:productId",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  removeProductFromDiscountHandler
);

export default router;
