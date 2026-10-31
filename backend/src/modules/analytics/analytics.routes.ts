import { Router } from "express";
import { UserRole } from "@prisma/client";
import * as analyticsController from "./analytics.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";

const router = Router();

router.use(authenticate);

// Admin dashboard & reports
router.get("/overview", authorize(UserRole.ADMIN), analyticsController.getOverview);
router.get("/revenue", authorize(UserRole.ADMIN), analyticsController.getRevenueTrends);
router.get("/subscriptions", authorize(UserRole.ADMIN), analyticsController.getSubscriptionGrowth);
router.get("/export", authorize(UserRole.ADMIN, UserRole.STAFF), analyticsController.exportCsv);

// Staff dashboard
router.get(
  "/staff",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  analyticsController.getStaffDashboard
);

// Customer personal dashboard
router.get(
  "/customer",
  authorize(UserRole.CUSTOMER, UserRole.ADMIN),
  analyticsController.getCustomerDashboard
);

export default router;

