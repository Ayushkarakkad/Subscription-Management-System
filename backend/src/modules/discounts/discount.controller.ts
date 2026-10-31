import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { UserRole } from "@prisma/client";
import {
  createDiscountSchema,
  updateDiscountSchema,
  updateDiscountStatusSchema,
  associateDiscountProductsSchema,
  discountQuerySchema,
  validateDiscountSchema
} from "./discount.validation";
import {
  createDiscount,
  getDiscounts,
  getDiscountById,
  updateDiscount,
  setDiscountStatus,
  associateProductsWithDiscount,
  getDiscountProducts,
  removeProductFromDiscount,
  validateAndCalculateDiscount,
  DiscountError
} from "./discount.service";

function handleError(error: unknown, res: Response, fallbackMessage: string) {
  if (error instanceof DiscountError) {
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

export async function createDiscountHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const validation = createDiscountSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid discount data",
        errors: validation.error.flatten().fieldErrors
      });
      return;
    }

    const discount = await createDiscount(validation.data);
    res.status(201).json({
      success: true,
      message: "Discount created successfully",
      data: discount
    });
  } catch (error) {
    handleError(error, res, "Failed to create discount");
  }
}

export async function getDiscountsHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const validation = discountQuerySchema.safeParse(req.query);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: validation.error.flatten().fieldErrors
      });
      return;
    }

    const isCustomer = req.user?.role === UserRole.CUSTOMER;
    const result = await getDiscounts(validation.data, isCustomer);

    res.status(200).json({
      success: true,
      message: "Discounts retrieved successfully",
      data: result.discounts,
      pagination: result.pagination
    });
  } catch (error) {
    handleError(error, res, "Failed to retrieve discounts");
  }
}

export async function getDiscountByIdHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: "Discount ID is required" });
      return;
    }

    const isCustomer = req.user?.role === UserRole.CUSTOMER;
    const discount = await getDiscountById(id, isCustomer);

    res.status(200).json({
      success: true,
      message: "Discount retrieved successfully",
      data: discount
    });
  } catch (error) {
    handleError(error, res, "Failed to retrieve discount");
  }
}

export async function updateDiscountHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: "Discount ID is required" });
      return;
    }

    const validation = updateDiscountSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid discount update data",
        errors: validation.error.flatten().fieldErrors
      });
      return;
    }

    const updated = await updateDiscount(id, validation.data);
    res.status(200).json({
      success: true,
      message: "Discount updated successfully",
      data: updated
    });
  } catch (error) {
    handleError(error, res, "Failed to update discount");
  }
}

export async function setDiscountStatusHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: "Discount ID is required" });
      return;
    }

    const validation = updateDiscountStatusSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid status data",
        errors: validation.error.flatten().fieldErrors
      });
      return;
    }

    const updated = await setDiscountStatus(id, validation.data.isActive);
    res.status(200).json({
      success: true,
      message: `Discount ${validation.data.isActive ? "activated" : "deactivated"} successfully`,
      data: updated
    });
  } catch (error) {
    handleError(error, res, "Failed to change discount status");
  }
}

// ==========================================
// PRODUCT ASSOCIATIONS
// ==========================================

export async function associateProductsHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: "Discount ID is required" });
      return;
    }

    const validation = associateDiscountProductsSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid product association data",
        errors: validation.error.flatten().fieldErrors
      });
      return;
    }

    let items;
    if (Array.isArray(validation.data)) {
      items = validation.data;
    } else if ("products" in validation.data) {
      items = validation.data.products;
    } else {
      items = [validation.data];
    }

    const associated = await associateProductsWithDiscount(id, items);
    res.status(201).json({
      success: true,
      message: "Products associated with discount successfully",
      data: associated
    });
  } catch (error) {
    handleError(error, res, "Failed to associate products with discount");
  }
}

export async function getDiscountProductsHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: "Discount ID is required" });
      return;
    }

    const products = await getDiscountProducts(id);
    res.status(200).json({
      success: true,
      message: "Associated products retrieved successfully",
      data: products
    });
  } catch (error) {
    handleError(error, res, "Failed to retrieve associated products");
  }
}

export async function removeProductFromDiscountHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = getParam(req.params.id);
    const productId = getParam(req.params.productId);
    if (!id || !productId) {
      res.status(400).json({
        success: false,
        message: "Discount ID and Product ID are required"
      });
      return;
    }

    const variantId = typeof req.query.variantId === "string" ? req.query.variantId : undefined;
    const result = await removeProductFromDiscount(id, productId, variantId);

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    handleError(error, res, "Failed to remove product from discount");
  }
}

// ==========================================
// VALIDATION & CALCULATION CONTROLLER
// ==========================================

export async function validateDiscountHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const validation = validateDiscountSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid validation payload",
        errors: validation.error.flatten().fieldErrors
      });
      return;
    }

    const result = await validateAndCalculateDiscount(validation.data);
    res.status(200).json({
      success: true,
      message: result.eligible ? "Discount is applicable" : "Discount is not applicable",
      data: result
    });
  } catch (error) {
    handleError(error, res, "Failed to validate discount");
  }
}
