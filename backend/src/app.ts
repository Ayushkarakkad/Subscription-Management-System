import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes";
import productRoutes from "./modules/products/product.routes";
import planRoutes from "./modules/plans/plan.routes";
import taxRoutes from "./modules/taxes/tax.routes";
import discountRoutes from "./modules/discounts/discount.routes";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(",")
      : ["http://localhost:5173"],
    credentials: true
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/taxes", taxRoutes);
app.use("/api/discounts", discountRoutes);

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Subscription Management API is running",
    timestamp: new Date().toISOString()
  });
});

export default app;
