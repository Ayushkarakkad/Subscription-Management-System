import { Router } from "express";
import { UserRole } from "@prisma/client";
import * as invoicesController from "./invoices.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validation.middleware";
import {
  createInvoiceSchema,
  updateInvoiceStatusSchema
} from "./invoices.validation";

const router = Router();

router.use(authenticate);

router.get("/", invoicesController.list);
router.get("/:id", invoicesController.getById);
router.get("/:id/pdf", invoicesController.downloadPdf);

// Staff and Admin can generate invoices and change status
router.post(
  "/",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  validate(createInvoiceSchema),
  invoicesController.create
);

router.patch(
  "/:id/status",
  authorize(UserRole.ADMIN, UserRole.STAFF),
  validate(updateInvoiceStatusSchema),
  invoicesController.updateStatus
);

export default router;

