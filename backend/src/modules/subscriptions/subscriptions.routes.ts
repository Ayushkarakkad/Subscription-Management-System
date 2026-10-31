import { Router } from "express";
import { UserRole } from "@prisma/client";
import * as subscriptionsController from "./subscriptions.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validation.middleware";
import {
  createSubscriptionSchema,
  changePlanSchema
} from "./subscriptions.validation";

const router = Router();

router.use(authenticate);

// Listing & details (customers see their own, staff & admin see all)
router.get("/", subscriptionsController.list);
router.get("/:id", subscriptionsController.getById);

// Staff and Admin create subscriptions
router.post(
  "/",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  validate(createSubscriptionSchema),
  subscriptionsController.create
);

// Staff and Admin can pause/resume/renew
router.post(
  "/:id/pause",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  subscriptionsController.pause
);

router.post(
  "/:id/resume",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  subscriptionsController.resume
);

router.post(
  "/:id/renew",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  subscriptionsController.renew
);

router.post(
  "/:id/change-plan",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  validate(changePlanSchema),
  subscriptionsController.changePlan
);

// Cancellation can be requested by customers or performed by staff/admin
router.post("/:id/cancel", subscriptionsController.cancel);

// Trigger automated billing cycle manually (Admin or internal job)
router.post(
  "/run-billing-cycle",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  subscriptionsController.runBilling
);

export default router;

