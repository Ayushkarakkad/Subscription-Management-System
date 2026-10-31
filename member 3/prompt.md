# MEMBER 3 — BACKEND DEVELOPMENT ASSIGNMENT
## Subscription Management System

You are responsible for developing four major backend modules for our Subscription Management System:

1. Product Management
2. Subscription Plan Management
3. Tax Management
4. Discount Management

Your task is to implement fully functional, tested REST APIs for these modules and integrate them with our existing backend.

This is a collaborative project. Other team members are working on authentication, subscriptions, invoices, customers, quotations, payments and frontend development. Your implementation must not break or interfere with their work.

---

# 1. TECHNOLOGY STACK

Use the existing project technology stack:

- Node.js
- Express.js
- TypeScript
- PostgreSQL
- Prisma ORM
- Zod for validation
- JWT authentication
- Git and GitHub

Do not introduce another backend framework or database.

# 2. PROJECT STRUCTURE

The backend already has the following structure:

backend/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── config/
│   │   └── database.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   └── role.middleware.ts
│   ├── modules/
│   │   ├── products/
│   │   ├── plans/
│   │   ├── taxes/
│   │   ├── discounts/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── customers/
│   │   ├── quotations/
│   │   ├── subscriptions/
│   │   ├── invoices/
│   │   ├── payments/
│   │   └── analytics/
│   ├── app.ts
│   └── server.ts
├── package.json
└── tsconfig.json

For each of your four modules, use this structure:

module-name/
├── module.routes.ts
├── module.controller.ts
├── module.service.ts
└── module.validation.ts

Keep business logic in service files, request handling in controller files, routes in route files and validation schemas in validation files.

# 3. MODULE 1 — PRODUCT MANAGEMENT

Develop complete product management functionality.

### Required features

- Create a product.
- Retrieve all products.
- Retrieve an individual product by ID.
- Update product information.
- Activate or deactivate products.
- Support product variants.
- Retrieve products with their variants.
- Search and filter products.
- Support pagination.

### Product fields

Use the existing Prisma Product model and its actual field names. Expected business information includes:

- Product name
- Description
- Product type/category, if supported by the schema
- Product price
- Product status
- Creation and modification timestamps

### Product variants

Implement variant management using the existing ProductVariant model.

Support:
- Create a variant.
- List variants belonging to a product.
- Update a variant.
- Activate/deactivate a variant.
- Associate variants with their parent product.

### Suggested API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/products | Create product |
| GET | /api/products | List products |
| GET | /api/products/:id | Get product |
| PUT | /api/products/:id | Update product |
| PATCH | /api/products/:id/status | Change status |
| POST | /api/products/:id/variants | Create variant |
| GET | /api/products/:id/variants | List variants |
| PUT | /api/products/:id/variants/:variantId | Update variant |
| PATCH | /api/products/:id/variants/:variantId/status | Change variant status |

# 4. MODULE 2 — SUBSCRIPTION PLAN MANAGEMENT

Develop subscription plan management.

### Required features

- Create subscription plans.
- Retrieve all plans.
- Retrieve individual plans.
- Update plans.
- Activate/deactivate plans.
- Associate multiple products with a plan.
- Retrieve products included in a plan.
- Support different billing intervals.
- Support plan pricing and billing configuration.

### Billing intervals

Use the existing BillingInterval enum:

- DAILY
- WEEKLY
- MONTHLY
- YEARLY

### Plan information

Use the existing Prisma Plan model. Expected business information includes:

- Plan name
- Description
- Price
- Billing interval
- Billing configuration
- Active/inactive status
- Associated products

### Plan-product association

Use the existing PlanProduct model.

Support:
- Adding products to a plan.
- Removing products from a plan.
- Updating product quantities or configuration where supported by the schema.
- Retrieving all products associated with a plan.

### Suggested API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/plans | Create plan |
| GET | /api/plans | List plans |
| GET | /api/plans/:id | Get plan |
| PUT | /api/plans/:id | Update plan |
| PATCH | /api/plans/:id/status | Change status |
| POST | /api/plans/:id/products | Add products |
| GET | /api/plans/:id/products | List plan products |
| DELETE | /api/plans/:id/products/:productId | Remove product |

# 5. MODULE 3 — TAX MANAGEMENT

Develop tax configuration and management.

### Required features

- Create taxes.
- Retrieve all taxes.
- Retrieve individual tax details.
- Update tax configurations.
- Activate/deactivate taxes.
- Support different tax rates.
- Validate tax percentages.
- Allow other billing modules to retrieve applicable tax configurations.

### Tax information

Use the existing Prisma Tax model and its actual fields.

Expected information includes:

- Tax name
- Tax rate
- Description, if supported
- Active/inactive status
- Creation and modification timestamps

### Suggested API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/taxes | Create tax |
| GET | /api/taxes | List taxes |
| GET | /api/taxes/:id | Get tax |
| PUT | /api/taxes/:id | Update tax |
| PATCH | /api/taxes/:id/status | Change status |

# 6. MODULE 4 — DISCOUNT MANAGEMENT

Develop a complete discount management system.

### Required features

- Create discounts.
- Retrieve all discounts.
- Retrieve individual discounts.
- Update discounts.
- Activate/deactivate discounts.
- Support fixed discounts.
- Support percentage discounts.
- Configure discount validity.
- Configure discount usage limits.
- Associate discounts with selected products.
- Support subscription-level discounts where the schema permits.
- Track discount usage through the existing models.

### Discount types

Use the existing DiscountType enum:

- FIXED
- PERCENTAGE

Use the existing DiscountScope enum:

- PRODUCT
- SUBSCRIPTION
- BOTH

### Discount information

Use the existing Prisma Discount model.

Expected business information includes:

- Discount name
- Description
- Discount type
- Discount value
- Discount scope
- Start date
- End date
- Usage limits
- Active/inactive status

### Product association

Use the existing DiscountProduct model.

Support:
- Associating products with discounts.
- Removing products from discounts.
- Retrieving applicable products.

### Suggested API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/discounts | Create discount |
| GET | /api/discounts | List discounts |
| GET | /api/discounts/:id | Get discount |
| PUT | /api/discounts/:id | Update discount |
| PATCH | /api/discounts/:id/status | Change status |
| POST | /api/discounts/:id/products | Associate products |
| GET | /api/discounts/:id/products | List associated products |
| DELETE | /api/discounts/:id/products/:productId | Remove association |

Implement discount eligibility and calculation logic carefully. Do not allow negative prices or discounts exceeding the applicable amount. Enforce validity dates and usage limits.

# 7. AUTHENTICATION AND AUTHORIZATION

Our project already contains:

- auth.middleware.ts
- role.middleware.ts

Import and reuse these existing middlewares.

Do not implement another JWT system.

All management endpoints must be protected.

Use the existing UserRole enum:

- ADMIN
- STAFF
- CUSTOMER

Recommended access policy:

| Operation | ADMIN | STAFF | CUSTOMER |
|---|---|---|---|
| View products | Yes | Yes | Yes |
| Create/update products | Yes | Yes | No |
| View plans | Yes | Yes | Yes |
| Create/update plans | Yes | Yes | No |
| View taxes | Yes | Yes | No |
| Manage taxes | Yes | Yes | No |
| View discounts | Yes | Yes | According to eligibility |
| Create/update discounts | Yes | Yes | No |

Keep customer-facing access restricted to the information needed by the customer portal.

# 8. VALIDATION AND ERROR HANDLING

Use Zod for all incoming request validation.

Validate:
- Required fields.
- String lengths.
- Valid numerical values.
- Non-negative prices.
- Valid percentage ranges.
- Valid dates.
- Valid billing intervals.
- Valid discount types and scopes.
- Product and plan existence.
- Duplicate associations.

Use appropriate HTTP status codes:

- 200 — Successful request.
- 201 — Resource created.
- 400 — Invalid request.
- 401 — Authentication required.
- 403 — Permission denied.
- 404 — Resource not found.
- 409 — Duplicate or conflicting resource.
- 500 — Internal server error.

Return consistent JSON responses:

{
  "success": true,
  "message": "Operation successful",
  "data": {}
}

Do not expose database errors, passwords, tokens or internal stack traces to clients.

# 9. DATABASE RULES — VERY IMPORTANT

The Prisma schema and PostgreSQL database have already been created.

Existing models include:

- Product
- ProductVariant
- Plan
- PlanProduct
- Tax
- Discount
- DiscountProduct
- SubscriptionDiscount
- DiscountUsage

IMPORTANT:

1. Inspect the existing prisma/schema.prisma before writing code.
2. Use the exact existing field names, enum names and relationships.
3. Do not recreate existing models.
4. Do not change existing models or database migrations independently.
5. If a schema change is genuinely necessary, discuss it with the project lead first.
6. Use Prisma transactions when multiple related records must be updated together.
7. Use Decimal for monetary calculations instead of JavaScript floating-point arithmetic.
8. Never hardcode database credentials.

# 10. INTEGRATION REQUIREMENTS

Your modules must work with the other backend modules.

Pay special attention to:

- Products being referenced by subscription plans.
- Plans being used during subscription creation.
- Taxes being available for invoice calculations.
- Discounts being available during quotation and subscription calculations.
- Product and plan deactivation not breaking existing subscriptions.
- Discounts not being applied outside their validity period.

Do not implement subscription creation, invoice generation, payment processing or quotation management. Those are assigned to other team members.

# 11. TESTING REQUIREMENTS

Test all endpoints using Thunder Client or Postman.

For each module, test:

- Successful creation.
- Successful retrieval.
- Successful update.
- Invalid input.
- Missing authentication.
- Unauthorized role.
- Nonexistent IDs.
- Duplicate records or associations.
- Invalid relationships.
- Deactivated resources.

Test with real PostgreSQL data through Prisma.

Do not consider a module complete merely because TypeScript compiles.

# 12. GIT AND GITHUB WORKFLOW

Work on your assigned feature branch, not directly on main.

Use a branch such as:

feature/member-3-products-plans-taxes-discounts

Before beginning:
- Pull the latest main branch.
- Inspect the existing backend.
- Do not overwrite existing project files.

Commit your work with meaningful messages, for example:

- Implement product management APIs
- Implement subscription plan APIs
- Implement tax management APIs
- Implement discount management APIs
- Add validation and API tests

Push your branch to GitHub and create a pull request targeting main.

Do not merge your own changes into main without project lead approval.

# 13. FINAL DELIVERABLES

Submit:

1. Complete source code for all four modules.
2. All routes, controllers, services and validation files.
3. Any approved Prisma schema changes.
4. API endpoint documentation.
5. Thunder Client/Postman test evidence.
6. A README explaining how to use your modules.
7. Successful TypeScript build output.
8. GitHub branch and pull request link.

# 14. DEVELOPMENT EXPECTATIONS

- Write clean, modular TypeScript.
- Use async/await.
- Avoid duplicated code.
- Use reusable helper functions where appropriate.
- Keep controllers thin and services responsible for business logic.
- Follow the existing project coding conventions.
- Do not introduce unnecessary dependencies.
- Do not modify other team members' modules.
- Do not submit empty files or placeholder implementations.
- Do not claim an API works unless you have tested it.

## FINAL OBJECTIVE

Deliver four complete, functional backend modules — Products, Plans, Taxes and Discounts — that integrate cleanly into our existing Subscription Management System.

Work independently within your assigned scope, communicate any database or integration conflicts to the project lead, and submit your implementation through a GitHub pull request for review.