import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { UserRole } from "@prisma/client";
import {
  createPlanSchema,
  updatePlanSchema,
  updatePlanStatusSchema,
  addPlanProductsSchema,
  updatePlanProductSchema,
  planQuerySchema
} from "./plan.validation";
import {
  createPlan,
  getPlans,
  getPlanById,
  updatePlan,
  setPlanStatus,
  addProductsToPlan,
  getPlanProducts,
  updatePlanProduct,
  removeProductFromPlan,
  PlanError
} from "./plan.service";

function handleError(error: unknown, res: Response, fallbackMessage: string) {
  if (error instanceof PlanError) {
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

export async function createPlanHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const validation = createPlanSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid plan data",
        errors: validation.error.flatten().fieldErrors
      });
      return;
    }

    const plan = await createPlan(validation.data);
    res.status(201).json({
      success: true,
      message: "Subscription plan created successfully",
      data: plan
    });
  } catch (error) {
    handleError(error, res, "Failed to create subscription plan");
  }
}

export async function getPlansHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const validation = planQuerySchema.safeParse(req.query);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: validation.error.flatten().fieldErrors
      });
      return;
    }

    const isCustomer = req.user?.role === UserRole.CUSTOMER;
    const result = await getPlans(validation.data, isCustomer);

    res.status(200).json({
      success: true,
      message: "Subscription plans retrieved successfully",
      data: result.plans,
      pagination: result.pagination
    });
  } catch (error) {
    handleError(error, res, "Failed to retrieve subscription plans");
  }
}

export async function getPlanByIdHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: "Plan ID is required" });
      return;
    }

    const isCustomer = req.user?.role === UserRole.CUSTOMER;
    const plan = await getPlanById(id, isCustomer);

    res.status(200).json({
      success: true,
      message: "Subscription plan retrieved successfully",
      data: plan
    });
  } catch (error) {
    handleError(error, res, "Failed to retrieve subscription plan");
  }
}

export async function updatePlanHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: "Plan ID is required" });
      return;
    }

    const validation = updatePlanSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid plan update data",
        errors: validation.error.flatten().fieldErrors
      });
      return;
    }

    const updated = await updatePlan(id, validation.data);
    res.status(200).json({
      success: true,
      message: "Subscription plan updated successfully",
      data: updated
    });
  } catch (error) {
    handleError(error, res, "Failed to update subscription plan");
  }
}

export async function setPlanStatusHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: "Plan ID is required" });
      return;
    }

    const validation = updatePlanStatusSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid status data",
        errors: validation.error.flatten().fieldErrors
      });
      return;
    }

    const updated = await setPlanStatus(id, validation.data.isActive);
    res.status(200).json({
      success: true,
      message: `Plan ${validation.data.isActive ? "activated" : "deactivated"} successfully`,
      data: updated
    });
  } catch (error) {
    handleError(error, res, "Failed to change plan status");
  }
}

// ==========================================
// PLAN PRODUCTS CONTROLLERS
// ==========================================

export async function addPlanProductsHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: "Plan ID is required" });
      return;
    }

    const validation = addPlanProductsSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid plan products payload",
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

    const added = await addProductsToPlan(id, items);
    res.status(201).json({
      success: true,
      message: "Products associated with plan successfully",
      data: added
    });
  } catch (error) {
    handleError(error, res, "Failed to associate products with plan");
  }
}

export async function getPlanProductsHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: "Plan ID is required" });
      return;
    }

    const products = await getPlanProducts(id);
    res.status(200).json({
      success: true,
      message: "Plan products retrieved successfully",
      data: products
    });
  } catch (error) {
    handleError(error, res, "Failed to retrieve plan products");
  }
}

export async function updatePlanProductHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = getParam(req.params.id);
    const productId = getParam(req.params.productId);
    if (!id || !productId) {
      res.status(400).json({
        success: false,
        message: "Plan ID and Product ID are required"
      });
      return;
    }

    const validation = updatePlanProductSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid product update data",
        errors: validation.error.flatten().fieldErrors
      });
      return;
    }

    const variantId = typeof req.query.variantId === "string" ? req.query.variantId : undefined;
    const updated = await updatePlanProduct(id, productId, validation.data, variantId);

    res.status(200).json({
      success: true,
      message: "Plan product updated successfully",
      data: updated
    });
  } catch (error) {
    handleError(error, res, "Failed to update plan product");
  }
}

export async function removeProductFromPlanHandler(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const id = getParam(req.params.id);
    const productId = getParam(req.params.productId);
    if (!id || !productId) {
      res.status(400).json({
        success: false,
        message: "Plan ID and Product ID are required"
      });
      return;
    }

    const variantId = typeof req.query.variantId === "string" ? req.query.variantId : undefined;
    const result = await removeProductFromPlan(id, productId, variantId);

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    handleError(error, res, "Failed to remove product from plan");
  }
}
