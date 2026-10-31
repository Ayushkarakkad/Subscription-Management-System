import { Response, NextFunction } from "express";
import * as invoicesService from "./invoices.service";
import { sendSuccess, sendError } from "../../utils/response.utils";
import { AuthRequest } from "../../middleware/auth.middleware";

export async function list(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const { invoices, meta } = await invoicesService.listInvoices(
      req.query as any,
      req.user
    );
    sendSuccess(res, invoices, "Invoices retrieved", 200, meta);
  } catch (error: any) {
    sendError(res, error.message || "Failed to list invoices", 500);
  }
}

export async function getById(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const invoice = await invoicesService.getInvoiceById(
      req.params.id,
      req.user
    );
    sendSuccess(res, invoice);
  } catch (error: any) {
    sendError(res, error.message || "Invoice not found", 404);
  }
}

export async function create(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const invoice = await invoicesService.createInvoice(
      req.body,
      req.user?.userId
    );
    sendSuccess(res, invoice, "Invoice generated successfully", 201);
  } catch (error: any) {
    sendError(res, error.message || "Failed to create invoice", 400);
  }
}

export async function updateStatus(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const invoice = await invoicesService.updateInvoiceStatus(
      req.params.id,
      req.body.status,
      req.user?.userId
    );
    sendSuccess(res, invoice, "Invoice status updated");
  } catch (error: any) {
    sendError(res, error.message || "Failed to update invoice status", 400);
  }
}

export async function downloadPdf(
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const pdfBuffer = await invoicesService.downloadInvoicePdf(
      req.params.id,
      req.user
    );
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="invoice-${req.params.id}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error: any) {
    sendError(res, error.message || "Failed to generate PDF", 500);
  }
}

