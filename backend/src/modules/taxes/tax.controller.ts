import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import {
  createTaxSchema,
  updateTaxSchema,
  updateTaxStatusSchema,
  taxQuerySchema
} from "./tax.validation";
import {
  createTax,
  getTaxes,
  getTaxById,
  updateTax,
  setTaxStatus,
  TaxError
} from "./tax.service";

function handleError(error: unknown, res: Response, fallbackMessage: string) {
  if (error instanceof TaxError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
    return;
  }

  console.error(fallbackMessage, error);
  res.status(500).json({
    success: false,
    message: fallbackMessage
  });
}

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0];
  return param ?? "";
}

export async function createTaxHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const validation = createTaxSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid tax configuration data",
        errors: validation.error.flatten().fieldErrors
      });
      return;
    }

    const tax = await createTax(validation.data);
    res.status(201).json({
      success: true,
      message: "Tax configuration created successfully",
      data: tax
    });
  } catch (error) {
    handleError(error, res, "Failed to create tax configuration");
  }
}

export async function getTaxesHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const validation = taxQuerySchema.safeParse(req.query);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: validation.error.flatten().fieldErrors
      });
      return;
    }

    const result = await getTaxes(validation.data);
    res.status(200).json({
      success: true,
      message: "Tax configurations retrieved successfully",
      data: result.taxes,
      pagination: result.pagination
    });
  } catch (error) {
    handleError(error, res, "Failed to retrieve tax configurations");
  }
}

export async function getTaxByIdHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: "Tax ID is required" });
      return;
    }

    const tax = await getTaxById(id);
    res.status(200).json({
      success: true,
      message: "Tax configuration retrieved successfully",
      data: tax
    });
  } catch (error) {
    handleError(error, res, "Failed to retrieve tax configuration");
  }
}

export async function updateTaxHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: "Tax ID is required" });
      return;
    }

    const validation = updateTaxSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid tax update data",
        errors: validation.error.flatten().fieldErrors
      });
      return;
    }

    const updated = await updateTax(id, validation.data);
    res.status(200).json({
      success: true,
      message: "Tax configuration updated successfully",
      data: updated
    });
  } catch (error) {
    handleError(error, res, "Failed to update tax configuration");
  }
}

export async function setTaxStatusHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: "Tax ID is required" });
      return;
    }

    const validation = updateTaxStatusSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid status data",
        errors: validation.error.flatten().fieldErrors
      });
      return;
    }

    const updated = await setTaxStatus(id, validation.data.isActive);
    res.status(200).json({
      success: true,
      message: `Tax ${validation.data.isActive ? "activated" : "deactivated"} successfully`,
      data: updated
    });
  } catch (error) {
    handleError(error, res, "Failed to change tax status");
  }
}
