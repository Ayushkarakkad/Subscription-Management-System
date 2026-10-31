import { Router } from "express";
import { UserRole } from "@prisma/client";
import * as plansController from "./plans.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validation.middleware";
import {
  createPlanSchema,
  updatePlanSchema,
  updateStatusSchema,
  planProductInputSchema,
  updatePlanProductSchema
} from "./plans.validation";

const router = Router();

router.use(authenticate);

// Listing & viewing available to all authenticated users
router.get("/", plansController.list);
router.get("/:id", plansController.getById);

// Admin & Staff can create/update plans
router.post(
  "/",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  validate(createPlanSchema),
  plansController.create
);

router.put(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  validate(updatePlanSchema),
  plansController.update
);

router.patch(
  "/:id/status",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  validate(updateStatusSchema),
  plansController.setStatus
);

// Plan Products
router.get("/:id/products", plansController.getProducts);

router.post(
  "/:id/products",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  validate(planProductInputSchema),
  plansController.addProduct
);

router.put(
  "/:id/products/:productId",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  validate(updatePlanProductSchema),
  plansController.updateProduct
);

router.delete(
  "/:id/products/:productId",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  plansController.removeProduct
);

export default router;

