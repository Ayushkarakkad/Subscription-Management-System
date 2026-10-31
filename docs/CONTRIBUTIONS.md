# Brightloop Project Team - Contributions Matrix

This project was built to production standards following a modular 4-member engineering architecture as outlined in the system requirements.

---

## Member 1: Authentication, User Architecture & Company Configuration
- **Responsibilities:** Core identity management, security foundations, and organization parameters.
- **Backend Deliverables:**
  - `src/controllers/auth.controller.ts`, `src/routes/auth.routes.ts`
  - `src/controllers/user.controller.ts`, `src/routes/user.routes.ts`
  - `src/controllers/settings.controller.ts`, `src/routes/settings.routes.ts`
  - `src/middlewares/auth.middleware.ts`, `src/middlewares/role.middleware.ts`
  - Bcrypt password hashing, JWT bearer generation, password reset tokens.
- **Frontend Deliverables:**
  - `src/pages/auth/Login.tsx` (with 1-click credential presets for fast testing)
  - `src/pages/auth/Register.tsx`, `src/pages/auth/ForgotPassword.tsx`
  - `src/pages/users/UserManagement.tsx`
  - `src/pages/settings/ProfileSettings.tsx`, `src/pages/settings/SystemSettings.tsx`
  - `src/context/AuthContext.tsx`

---

## Member 2: Product Catalog, Subscription Plans, Taxes & Discounts
- **Responsibilities:** Product modeling, billing interval abstractions, and financial discount/tax engines.
- **Backend Deliverables:**
  - `src/controllers/product.controller.ts`, `src/routes/product.routes.ts`
  - `src/controllers/plan.controller.ts`, `src/routes/plan.routes.ts`
  - `src/controllers/tax.controller.ts`, `src/routes/tax.routes.ts`
  - `src/controllers/discount.controller.ts`, `src/routes/discount.routes.ts`
  - Validation engine for promo codes (min spend, date window, usage counters).
- **Frontend Deliverables:**
  - `src/pages/products/ProductManagement.tsx` (with variant attribute modaling)
  - `src/pages/plans/PlanManagement.tsx` (frequency and trial period badges)
  - `src/pages/taxes/TaxManagement.tsx`
  - `src/pages/discounts/DiscountManagement.tsx`

---

## Member 3: Quotation Workflow & Recurring Subscription Engine
- **Responsibilities:** Commercial proposals, lifecycle transitions, automated recurring billing engine, and PDF generation.
- **Backend Deliverables:**
  - `src/controllers/quotation.controller.ts`, `src/routes/quotation.routes.ts`
  - `src/controllers/subscription.controller.ts`, `src/routes/subscription.routes.ts`
  - `src/controllers/recurring.controller.ts`, `src/routes/recurring.routes.ts`
  - `src/cron.ts` (Scheduled node-cron billing agent)
  - `src/utils/date.utils.ts` (Leap year and month-end date clamping algorithms)
  - `src/utils/pdf.utils.ts` (PDFKit document formatting for quotes and invoices)
  - Idempotent recurring billing engine enforcing `[subscriptionId, periodStart, periodEnd]`.
- **Frontend Deliverables:**
  - `src/pages/quotations/QuotationManagement.tsx` (PDF download, direct conversion to subscription)
  - `src/pages/subscriptions/SubscriptionManagement.tsx` (Pause, resume, change plan, cancel)
  - `src/pages/dashboards/CustomerDashboard.tsx`

---

## Member 4: Invoices, Payments, Financial Analytics & UI Shell
- **Responsibilities:** Financial ledger, payment reconciliation, analytics dashboards, CSV export, and responsive design system.
- **Backend Deliverables:**
  - `src/controllers/invoice.controller.ts`, `src/routes/invoice.routes.ts`
  - `src/controllers/payment.controller.ts`, `src/routes/payment.routes.ts`
  - `src/controllers/analytics.controller.ts`, `src/routes/analytics.routes.ts`
  - `src/controllers/notification.controller.ts`, `src/routes/notification.routes.ts`
  - Financial metric aggregations: MRR, ARR, churn rate, and CSV data stream export.
- **Frontend Deliverables:**
  - `src/components/layout/Layout.tsx`, `Sidebar.tsx`, `Navbar.tsx`
  - `src/components/common/StatCard.tsx`, `Badge.tsx`, `Modal.tsx`, `EmptyState.tsx`, `LoadingSkeleton.tsx`
  - `src/pages/invoices/InvoiceManagement.tsx` (with PDF invoice streaming)
  - `src/pages/payments/PaymentManagement.tsx`
  - `src/pages/dashboards/AdminDashboard.tsx`, `StaffDashboard.tsx`
  - `src/pages/analytics/AnalyticsReports.tsx` (Recharts visualization + CSV export)

