import { Router } from "express";
import { UserRole } from "@prisma/client";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import {
  createPlanHandler,
  getPlansHandler,
  getPlanByIdHandler,
  updatePlanHandler,
  setPlanStatusHandler,
  addPlanProductsHandler,
  getPlanProductsHandler,
  updatePlanProductHandler,
  removeProductFromPlanHandler
} from "./plan.controller";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Plan routes
router.get(
  "/",
  authorize(UserRole.ADMIN, UserRole.STAFF, UserRole.CUSTOMER),
  getPlansHandler
);

router.post(
  "/",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  createPlanHandler
);

router.get(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.STAFF, UserRole.CUSTOMER),
  getPlanByIdHandler
);

router.put(
  "/:id",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  updatePlanHandler
);

router.patch(
  "/:id/status",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  setPlanStatusHandler
);

// Plan product association routes
router.post(
  "/:id/products",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  addPlanProductsHandler
);

router.get(
  "/:id/products",
  authorize(UserRole.ADMIN, UserRole.STAFF, UserRole.CUSTOMER),
  getPlanProductsHandler
);

router.put(
  "/:id/products/:productId",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  updatePlanProductHandler
);

router.delete(
  "/:id/products/:productId",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  removeProductFromPlanHandler
);

export default router;
