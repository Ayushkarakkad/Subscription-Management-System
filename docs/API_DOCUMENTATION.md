# Brightloop Subscription Management System - API Documentation

## Overview
The Brightloop Subscription Management API is built with Node.js, Express, TypeScript, and Prisma ORM targeting PostgreSQL. All endpoints follow RESTful conventions, return structured envelopes, and enforce JWT bearer authentication with role-based access control (`ADMIN`, `STAFF`, `CUSTOMER`).

Base URL: `http://localhost:5000/api`

---

## Response Envelopes

### Success Envelope
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Detailed error explanation",
    "details": []
  }
}
```

---

## 1. Authentication & Security Endpoints (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register a new user account with initial role |
| `POST` | `/api/auth/login` | Public | Authenticate with email/password; returns JWT |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current session user info |
| `PUT` | `/api/auth/profile` | Authenticated | Update user name, phone, address, company |
| `POST` | `/api/auth/change-password` | Authenticated | Change user account password |
| `POST` | `/api/auth/forgot-password` | Public | Issue a secure password reset token |
| `POST` | `/api/auth/reset-password` | Public | Reset password using verified token |

---

## 2. User & Team Management (`/api/users`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/users` | Admin | List all system accounts with roles and activity |
| `GET` | `/api/users/:id` | Admin | Retrieve individual user record |
| `POST` | `/api/users` | Admin | Create user directly with role assignment |
| `PUT` | `/api/users/:id` | Admin | Update user details or role |
| `PATCH` | `/api/users/:id/status`| Admin | Enable or suspend user account |
| `DELETE` | `/api/users/:id` | Admin | Soft or hard delete user account |

---

## 3. Customer Directory (`/api/customers`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/customers` | Admin, Staff | Filter and search customers with pagination |
| `GET` | `/api/customers/:id` | Admin, Staff | Get customer profile with linked subscriptions & invoices |
| `POST` | `/api/customers` | Admin, Staff | Create a new customer profile |
| `PUT` | `/api/customers/:id` | Admin, Staff | Update customer contact & billing address |
| `DELETE` | `/api/customers/:id`| Admin | Archive or remove customer record |

---

## 4. Products & Variants Catalog (`/api/products`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/products` | All Authenticated | List all active software products |
| `GET` | `/api/products/:id` | All Authenticated | Get product with SKU variants |
| `POST` | `/api/products` | Admin, Staff | Create a product entry |
| `PUT` | `/api/products/:id` | Admin, Staff | Update product metadata |
| `DELETE` | `/api/products/:id`| Admin | Remove product from catalog |
| `POST` | `/api/products/:id/variants` | Admin, Staff | Create a variant attribute (e.g. Users, Storage) |
| `PUT` | `/api/products/variants/:variantId` | Admin, Staff | Update variant pricing & attributes |
| `DELETE` | `/api/products/variants/:variantId` | Admin | Delete a product variant |

---

## 5. Subscription Plans (`/api/plans`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/plans` | All Authenticated | List recurring plans with interval & price |
| `GET` | `/api/plans/:id` | All Authenticated | Retrieve specific plan details |
| `POST` | `/api/plans` | Admin, Staff | Create a new recurring plan (DAILY, WEEKLY, MONTHLY, YEARLY) |
| `PUT` | `/api/plans/:id` | Admin, Staff | Update plan pricing, trial days, active status |
| `DELETE` | `/api/plans/:id`| Admin | Archive plan |

---

## 6. Quotation Engine (`/api/quotations`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/quotations` | Authenticated | List quotations (filtered by customer for CUSTOMER role) |
| `GET` | `/api/quotations/:id` | Authenticated | Get quote detail breakdown |
| `POST` | `/api/quotations` | Admin, Staff | Draft quotation with line items, tax, and discount |
| `PUT` | `/api/quotations/:id` | Admin, Staff | Update draft quote items and notes |
| `POST` | `/api/quotations/:id/send` | Admin, Staff | Transition quote to SENT status |
| `POST` | `/api/quotations/:id/convert`| Admin, Staff | Convert accepted quote into active subscription + invoice |
| `GET` | `/api/quotations/:id/pdf` | Authenticated | Generate and stream corporate PDF quotation document |

---

## 7. Subscriptions Lifecycle (`/api/subscriptions`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/subscriptions` | Authenticated | List subscriptions with next billing date |
| `GET` | `/api/subscriptions/:id` | Authenticated | Detailed view of subscription & cycle history |
| `POST` | `/api/subscriptions` | Admin, Staff | Manually create a subscription for customer |
| `POST` | `/api/subscriptions/:id/pause` | Admin, Staff | Pause active subscription billing |
| `POST` | `/api/subscriptions/:id/resume` | Admin, Staff | Resume paused subscription |
| `POST` | `/api/subscriptions/:id/cancel` | Authenticated | Cancel subscription at end of period or immediately |
| `POST` | `/api/subscriptions/:id/change-plan` | Authenticated | Upgrade/downgrade subscription tier |

---

## 8. Invoicing & Ledger (`/api/invoices`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/invoices` | Authenticated | List all invoices with balance due and payment status |
| `GET` | `/api/invoices/:id` | Authenticated | Invoice detail including line items and applied payments |
| `POST` | `/api/invoices` | Admin, Staff | Generate ad-hoc manual invoice |
| `GET` | `/api/invoices/:id/pdf` | Authenticated | Download formatted PDF invoice with legal footer |
| `POST` | `/api/invoices/:id/void` | Admin | Mark an invoice as VOID/CANCELLED |

---

## 9. Payments & Reconciliation (`/api/payments`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/payments` | Authenticated | List payment records |
| `POST` | `/api/payments` | Admin, Staff | Record received payment against invoice |
| `GET` | `/api/payments/:id` | Authenticated | View payment transaction details |

---

## 10. Taxes & Discounts (`/api/taxes`, `/api/discounts`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/taxes` | All Authenticated | List tax rates (e.g. VAT, GST, State Sales Tax) |
| `POST` | `/api/taxes` | Admin | Create tax rate rule |
| `PUT` | `/api/taxes/:id` | Admin | Update tax rate rule |
| `GET` | `/api/discounts` | All Authenticated | List promotional discount codes |
| `POST` | `/api/discounts` | Admin, Staff | Create discount code (PERCENTAGE or FIXED_AMOUNT) |
| `POST` | `/api/discounts/validate`| Authenticated | Validate promo code against cart subtotal |

---

## 11. Analytics & Reporting (`/api/analytics`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/analytics/admin` | Admin | Returns MRR, ARR, churn, collection rate, revenue graph |
| `GET` | `/api/analytics/staff` | Admin, Staff | Operational metrics: pending quotes, due invoices |
| `GET` | `/api/analytics/customer` | Customer | Customer spend summary, next bill date, active plans |
| `GET` | `/api/analytics/export` | Admin, Staff | Download raw CSV dataset (`?entity=invoices\|subscriptions\|payments`) |

---

## 12. Automated Cron Billing (`/api/billing/run-cron`)

- Scheduled automated engine runs daily at midnight (`0 0 * * *`) via node-cron.
- Manual trigger endpoint: `POST /api/billing/run-cron` (Admin only).
- Features idempotency protection: checks `BillingAttempt` records for matching `[subscriptionId, periodStart, periodEnd]` to prevent double billing.
- Automatically generates invoices and advances `nextBillingDate` handling leap years and 28/30/31-day month boundaries cleanly.

