import { Router } from "express";
import { UserRole } from "@prisma/client";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import {
  createTaxHandler,
  getTaxesHandler,
  getTaxByIdHandler,
  updateTaxHandler,
  setTaxStatusHandler
} from "./tax.controller";

const router = Router();

// All tax routes require authentication and are restricted to ADMIN and STAFF
router.use(authenticate);
router.use(authorize(UserRole.ADMIN, UserRole.STAFF));

router.get("/", getTaxesHandler);
router.post("/", createTaxHandler);
router.get("/:id", getTaxByIdHandler);
router.put("/:id", updateTaxHandler);
router.patch("/:id/status", setTaxStatusHandler);

export default router;
