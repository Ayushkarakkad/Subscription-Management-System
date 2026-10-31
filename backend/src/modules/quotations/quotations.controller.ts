import { Response, NextFunction } from "express";
import * as quotationsService from "./quotations.service";
import { sendSuccess, sendError } from "../../utils/response.utils";
import { AuthRequest } from "../../middleware/auth.middleware";

export async function list(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const { quotations, meta } = await quotationsService.listQuotations(
      req.query as any,
      req.user
    );
    sendSuccess(res, quotations, "Quotations retrieved", 200, meta);
  } catch (error: any) {
    sendError(res, error.message || "Failed to list quotations", 500);
  }
}

export async function getById(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const quotation = await quotationsService.getQuotationById(
      req.params.id,
      req.user
    );
    sendSuccess(res, quotation);
  } catch (error: any) {
    sendError(res, error.message || "Quotation not found", 404);
  }
}

export async function create(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const quotation = await quotationsService.createQuotation(
      req.body,
      req.user?.userId
    );
    sendSuccess(res, quotation, "Quotation created successfully", 201);
  } catch (error: any) {
    sendError(res, error.message || "Failed to create quotation", 400);
  }
}

export async function updateStatus(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const quotation = await quotationsService.updateQuotationStatus(
      req.params.id,
      req.body.status,
      req.user?.userId
    );
    sendSuccess(res, quotation, "Quotation status updated");
  } catch (error: any) {
    sendError(res, error.message || "Failed to update quotation status", 400);
  }
}

export async function convert(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const subscription = await quotationsService.convertQuotationToSubscription(
      req.params.id,
      req.user?.userId
    );
    sendSuccess(
      res,
      subscription,
      "Quotation converted to subscription successfully",
      201
    );
  } catch (error: any) {
    sendError(res, error.message || "Failed to convert quotation", 400);
  }
}

export async function downloadPdf(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const pdfBuffer = await quotationsService.generateQuotationPdf(
      req.params.id,
      req.user
    );
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="quotation-${req.params.id}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error: any) {
    sendError(res, error.message || "Failed to generate PDF", 500);
  }
}

