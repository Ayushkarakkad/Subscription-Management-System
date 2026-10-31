import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users/users.routes";
import customersRoutes from "./modules/customers/customers.routes";
import productsRoutes from "./modules/products/products.routes";
import plansRoutes from "./modules/plans/plans.routes";
import taxesRoutes from "./modules/taxes/taxes.routes";
import discountsRoutes from "./modules/discounts/discounts.routes";
import quotationsRoutes from "./modules/quotations/quotations.routes";
import subscriptionsRoutes from "./modules/subscriptions/subscriptions.routes";
import invoicesRoutes from "./modules/invoices/invoices.routes";
import paymentsRoutes from "./modules/payments/payments.routes";
import analyticsRoutes from "./modules/analytics/analytics.routes";
import settingsRoutes from "./modules/settings/settings.routes";
import notificationsRoutes from "./modules/notifications/notifications.routes";
import { errorHandler } from "./middleware/error.middleware";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(",")
      : ["http://localhost:5173", "http://localhost:3000"],
    credentials: true
  })
);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/plans", plansRoutes);
app.use("/api/taxes", taxesRoutes);
app.use("/api/discounts", discountsRoutes);
app.use("/api/quotations", quotationsRoutes);
app.use("/api/subscriptions", subscriptionsRoutes);
app.use("/api/invoices", invoicesRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/notifications", notificationsRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Brightloop Subscription Management API is running",
    timestamp: new Date().toISOString()
  });
});

// Centralized error handling
app.use(errorHandler);

export default app;

