# Subscription Management System — Member 3 Backend Modules

This package contains the implementation of the four core backend modules for the Subscription Management System:
1. **Product Management**
2. **Subscription Plan Management**
3. **Tax Management**
4. **Discount Management**

---

## 🚀 Features Implemented

### 1. Product Management (`/api/products`)
- Full CRUD for products with Decimal price precision (`salesPrice`, `costPrice`).
- Product variants support (`ProductVariant`): create, list, update, toggle status, and reference-safe delete.
- Filtering by `type`, `isActive`, full-text search across name/description/type, and pagination (`page`, `limit`).
- Role-based visibility: Customers only see active products and active variants.
- Deactivating products does not cascade or break existing subscriptions.

### 2. Subscription Plan Management (`/api/plans`)
- Plan creation with billing intervals: `DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`.
- Association with single or multiple products (`PlanProduct`).
- Custom or auto-calculated unit pricing (derived from product price + variant price extra).
- Update and delete associations without affecting parent product or subscription historical records.
- Status management (active/inactive) with date validity checks (`endDate >= startDate`).

### 3. Tax Management (`/api/taxes`)
- Configuration of applicable taxes with percentage rates (`0.00%` to `100.00%`).
- Duplicate detection by tax name.
- Protected to `ADMIN` and `STAFF` roles only.
- Helper service methods (`calculateTax`) for Quotation, Invoice, and Subscription modules.

### 4. Discount Management (`/api/discounts`)
- Fixed (`FIXED`) and Percentage (`PERCENTAGE`) discounts.
- Scope controls: `PRODUCT`, `SUBSCRIPTION`, `BOTH`.
- Comprehensive eligibility & calculation engine:
  - Enforces `startsAt` and `endsAt` validity windows.
  - Enforces `maxUses` global limits.
  - Enforces `minimumPurchase` amount and `minimumQuantity`.
  - Product-specific discount targeting.
  - Mathematical safety: Disallows negative prices or discounts exceeding 100% / total amount.
- Associated product management (`DiscountProduct`).
- Real-time evaluation endpoint: `POST /api/discounts/validate`.

---

## 📁 Module File Structure

```
backend/src/modules/
├── products/
│   ├── product.routes.ts
│   ├── product.controller.ts
│   ├── product.service.ts
│   └── product.validation.ts
├── plans/
│   ├── plan.routes.ts
│   ├── plan.controller.ts
│   ├── plan.service.ts
│   └── plan.validation.ts
├── taxes/
│   ├── tax.routes.ts
│   ├── tax.controller.ts
│   ├── tax.service.ts
│   └── tax.validation.ts
└── discounts/
    ├── discount.routes.ts
    ├── discount.controller.ts
    ├── discount.service.ts
    └── discount.validation.ts
```

---

## 🛠️ Setup & Running

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL running locally with database `subscription_management`
- `.env` configured in `backend/.env`:
  ```env
  DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/subscription_management?schema=public"
  PORT=5000
  JWT_SECRET="YOUR_JWT_SECRET_AT_LEAST_32_CHARS"
  ```

### 2. Apply Migrations & Generate Prisma Client
```bash
cd backend
npx prisma migrate dev
```

### 3. Build & Run
```bash
# Compile TypeScript
npm run build

# Start development server
npm run dev

# Or start compiled production server
npm start
```

---

## 🧪 Testing

### Automated Comprehensive Test Suite
An automated test suite running against real PostgreSQL data is included:
```bash
cd backend
npx tsx src/test-member3.ts
```
This tests **49 test cases** covering:
- ✅ Successful creation, retrieval, and update across all 4 modules.
- ✅ Validation errors on invalid inputs (negative prices, rate > 100%, invalid dates).
- ✅ Missing authentication (401).
- ✅ Role-based authorization: Customers attempting Admin/Staff actions (403).
- ✅ Nonexistent resource queries (404).
- ✅ Duplicate resources and associations (409).
- ✅ Activation/deactivation filters and status endpoints.
- ✅ Discount calculation engine (fixed, percentage, minimum thresholds).

### Thunder Client & Postman Collections
Import the ready-to-use collections included in `backend/`:
- **Postman**: `backend/postman_collection_member3.json`
- **Thunder Client**: `backend/thunder-collection_member3.json`

---

## 📄 API Documentation
Full endpoint-by-endpoint documentation with schemas and sample requests is available in:
[`backend/docs/API_DOCUMENTATION.md`](file:///c:/Users/ayush/OneDrive/Desktop/odoo/Subscription-Management-System/backend/docs/API_DOCUMENTATION.md)
