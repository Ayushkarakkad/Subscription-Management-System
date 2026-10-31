import { Router } from "express";
import { UserRole } from "@prisma/client";
import * as quotationsController from "./quotations.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validation.middleware";
import {
  createQuotationSchema,
  updateQuotationStatusSchema
} from "./quotations.validation";

const router = Router();

router.use(authenticate);

router.get("/", quotationsController.list);
router.get("/:id", quotationsController.getById);
router.get("/:id/pdf", quotationsController.downloadPdf);

// Staff and Admin can create, change status and convert quotations
router.post(
  "/",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  validate(createQuotationSchema),
  quotationsController.create
);

router.patch(
  "/:id/status",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  validate(updateQuotationStatusSchema),
  quotationsController.updateStatus
);

router.post(
  "/:id/convert",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  quotationsController.convert
);

export default router;

