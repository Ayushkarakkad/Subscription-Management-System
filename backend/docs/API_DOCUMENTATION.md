# Subscription Management System — Member 3 API Documentation

This document covers the complete specification for the 4 backend modules implemented by Member 3:
1. **Product Management** (`/api/products`)
2. **Subscription Plan Management** (`/api/plans`)
3. **Tax Management** (`/api/taxes`)
4. **Discount Management** (`/api/discounts`)

---

## Global Standards

- **Base URL**: `http://localhost:5000/api`
- **Content-Type**: `application/json`
- **Authentication**: Bearer JWT Token in `Authorization: Bearer <token>`
- **Response Format**:
  ```json
  {
    "success": true,
    "message": "Operation description",
    "data": {},
    "pagination": {} // optional, on paginated list endpoints
  }
  ```
- **Error Format**:
  ```json
  {
    "success": false,
    "message": "Human-readable error description",
    "errors": {} // optional field-level validation errors
  }
  ```
- **HTTP Status Codes**:
  - `200` OK
  - `201` Created
  - `400` Bad Request (Validation failure, negative values, etc.)
  - `401` Unauthorized (Missing or invalid token)
  - `403` Forbidden (Role permission denied)
  - `404` Not Found (Resource not found or inactive for customer)
  - `409` Conflict (Duplicate record or association)
  - `500` Internal Server Error

---

## Role Access Matrix

| Operation | ADMIN | STAFF | CUSTOMER |
|---|---|---|---|
| **View Products** | Yes | Yes | Yes (active only) |
| **Manage Products & Variants** | Yes | Yes | No (403) |
| **View Subscription Plans** | Yes | Yes | Yes (active only) |
| **Manage Subscription Plans** | Yes | Yes | No (403) |
| **View Taxes** | Yes | Yes | No (403) |
| **Manage Taxes** | Yes | Yes | No (403) |
| **View Discounts** | Yes | Yes | Yes (active & valid only) |
| **Manage Discounts** | Yes | Yes | No (403) |
| **Validate/Calculate Discounts** | Yes | Yes | Yes |

---

## 1. Product Management (`/api/products`)

### 1.1 List Products
- **Method**: `GET /api/products`
- **Roles**: `ADMIN`, `STAFF`, `CUSTOMER`
- **Query Parameters**:
  - `page` (number, default: 1)
  - `limit` (number, default: 10, max: 100)
  - `search` (string, searches name, description, type)
  - `type` (string, filter by exact product type)
  - `isActive` (boolean, filter by status — customers are always forced to `true`)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Products retrieved successfully",
    "data": [
      {
        "id": "uuid",
        "name": "Cloud Storage",
        "type": "SERVICE",
        "description": "Enterprise cloud storage",
        "salesPrice": "499.00",
        "costPrice": "200.00",
        "notes": null,
        "isActive": true,
        "variants": [
          {
            "id": "uuid",
            "productId": "uuid",
            "name": "Storage Tier",
            "value": "1TB",
            "priceExtra": "500.00",
            "isActive": true
          }
        ]
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
  ```

### 1.2 Create Product
- **Method**: `POST /api/products`
- **Roles**: `ADMIN`, `STAFF`
- **Request Body**:
  ```json
  {
    "name": "Enterprise Cloud Storage",
    "type": "SERVICE",
    "description": "Secure storage backup",
    "salesPrice": 499.00,
    "costPrice": 200.00,
    "notes": "Optional internal note",
    "isActive": true,
    "variants": [
      {
        "name": "Storage Tier",
        "value": "500GB",
        "priceExtra": 0,
        "isActive": true
      }
    ]
  }
  ```
- **Response (201 Created)**: Created product object.

### 1.3 Get Product by ID
- **Method**: `GET /api/products/:id`
- **Roles**: `ADMIN`, `STAFF`, `CUSTOMER`

### 1.4 Update Product
- **Method**: `PUT /api/products/:id`
- **Roles**: `ADMIN`, `STAFF`
- **Request Body** (partial fields allowed):
  ```json
  {
    "name": "Updated Cloud Storage",
    "salesPrice": 549.00
  }
  ```

### 1.5 Change Product Status
- **Method**: `PATCH /api/products/:id/status`
- **Roles**: `ADMIN`, `STAFF`
- **Request Body**:
  ```json
  {
    "isActive": false
  }
  ```

### 1.6 Create Product Variant
- **Method**: `POST /api/products/:id/variants`
- **Roles**: `ADMIN`, `STAFF`
- **Request Body**:
  ```json
  {
    "name": "Region",
    "value": "US-East",
    "priceExtra": 50.00,
    "isActive": true
  }
  ```

### 1.7 List Product Variants
- **Method**: `GET /api/products/:id/variants`
- **Roles**: `ADMIN`, `STAFF`, `CUSTOMER`

### 1.8 Update Product Variant
- **Method**: `PUT /api/products/:id/variants/:variantId`
- **Roles**: `ADMIN`, `STAFF`

### 1.9 Change Variant Status
- **Method**: `PATCH /api/products/:id/variants/:variantId/status`
- **Roles**: `ADMIN`, `STAFF`
- **Request Body**:
  ```json
  {
    "isActive": false
  }
  ```

### 1.10 Delete Variant
- **Method**: `DELETE /api/products/:id/variants/:variantId`
- **Roles**: `ADMIN`, `STAFF`
- **Behavior**: Safely checks references across plans, quotations, subscriptions, and invoices. If referenced, rejects with 409 and guides to deactivate instead.

---

## 2. Subscription Plan Management (`/api/plans`)

### 2.1 List Plans
- **Method**: `GET /api/plans`
- **Roles**: `ADMIN`, `STAFF`, `CUSTOMER`
- **Query Parameters**:
  - `page`, `limit`, `search`
  - `billingInterval` (`DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`)
  - `isActive` (boolean)

### 2.2 Create Subscription Plan
- **Method**: `POST /api/plans`
- **Roles**: `ADMIN`, `STAFF`
- **Request Body**:
  ```json
  {
    "name": "Pro Monthly Plan",
    "description": "Full featured monthly subscription",
    "price": 999.00,
    "billingInterval": "MONTHLY",
    "minimumQuantity": 1,
    "startDate": "2026-01-01T00:00:00.000Z",
    "endDate": "2027-01-01T00:00:00.000Z",
    "autoClose": false,
    "allowEarlyClose": true,
    "allowPause": true,
    "allowRenewal": true,
    "isActive": true,
    "products": [
      {
        "productId": "uuid",
        "quantity": 1,
        "unitPrice": 499.00
      }
    ]
  }
  ```

### 2.3 Get Plan by ID
- **Method**: `GET /api/plans/:id`
- **Roles**: `ADMIN`, `STAFF`, `CUSTOMER`

### 2.4 Update Plan
- **Method**: `PUT /api/plans/:id`
- **Roles**: `ADMIN`, `STAFF`

### 2.5 Change Plan Status
- **Method**: `PATCH /api/plans/:id/status`
- **Roles**: `ADMIN`, `STAFF`
- **Request Body**:
  ```json
  {
    "isActive": false
  }
  ```

### 2.6 Associate Products with Plan
- **Method**: `POST /api/plans/:id/products`
- **Roles**: `ADMIN`, `STAFF`
- **Request Body**:
  ```json
  {
    "productId": "uuid",
    "variantId": "uuid (optional)",
    "quantity": 2,
    "unitPrice": 450.00
  }
  ```
  *(Also accepts an array or `{ products: [...] }`)*

### 2.7 List Products in Plan
- **Method**: `GET /api/plans/:id/products`
- **Roles**: `ADMIN`, `STAFF`, `CUSTOMER`

### 2.8 Update Plan Product Quantity/Price
- **Method**: `PUT /api/plans/:id/products/:productId`
- **Roles**: `ADMIN`, `STAFF`
- **Request Body**:
  ```json
  {
    "quantity": 3,
    "unitPrice": 400.00
  }
  ```

### 2.9 Remove Product from Plan
- **Method**: `DELETE /api/plans/:id/products/:productId`
- **Roles**: `ADMIN`, `STAFF`

---

## 3. Tax Management (`/api/taxes`)

### 3.1 List Taxes
- **Method**: `GET /api/taxes`
- **Roles**: `ADMIN`, `STAFF`
- **Query Parameters**: `page`, `limit`, `search`, `isActive`

### 3.2 Create Tax
- **Method**: `POST /api/taxes`
- **Roles**: `ADMIN`, `STAFF`
- **Request Body**:
  ```json
  {
    "name": "GST 18%",
    "rate": 18.00,
    "description": "Standard goods and services tax rate",
    "isActive": true
  }
  ```

### 3.3 Get Tax by ID
- **Method**: `GET /api/taxes/:id`
- **Roles**: `ADMIN`, `STAFF`

### 3.4 Update Tax
- **Method**: `PUT /api/taxes/:id`
- **Roles**: `ADMIN`, `STAFF`

### 3.5 Change Tax Status
- **Method**: `PATCH /api/taxes/:id/status`
- **Roles**: `ADMIN`, `STAFF`
- **Request Body**:
  ```json
  {
    "isActive": false
  }
  ```

---

## 4. Discount Management (`/api/discounts`)

### 4.1 List Discounts
- **Method**: `GET /api/discounts`
- **Roles**: `ADMIN`, `STAFF`, `CUSTOMER` (customers see active and unexpired only)
- **Query Parameters**: `page`, `limit`, `search`, `type` (`FIXED` | `PERCENTAGE`), `scope` (`PRODUCT` | `SUBSCRIPTION` | `BOTH`), `isActive`

### 4.2 Create Discount
- **Method**: `POST /api/discounts`
- **Roles**: `ADMIN`, `STAFF`
- **Request Body**:
  ```json
  {
    "name": "Summer Welcome 20%",
    "description": "20% off for seasonal subscriptions",
    "type": "PERCENTAGE",
    "scope": "BOTH",
    "value": 20.00,
    "minimumPurchase": 500.00,
    "minimumQuantity": 1,
    "startsAt": "2026-06-01T00:00:00.000Z",
    "endsAt": "2026-08-31T23:59:59.000Z",
    "maxUses": 500,
    "isActive": true
  }
  ```

### 4.3 Get Discount by ID
- **Method**: `GET /api/discounts/:id`
- **Roles**: `ADMIN`, `STAFF`, `CUSTOMER`

### 4.4 Update Discount
- **Method**: `PUT /api/discounts/:id`
- **Roles**: `ADMIN`, `STAFF`

### 4.5 Change Discount Status
- **Method**: `PATCH /api/discounts/:id/status`
- **Roles**: `ADMIN`, `STAFF`
- **Request Body**:
  ```json
  {
    "isActive": false
  }
  ```

### 4.6 Associate Products with Discount
- **Method**: `POST /api/discounts/:id/products`
- **Roles**: `ADMIN`, `STAFF`
- **Request Body**:
  ```json
  {
    "productId": "uuid",
    "variantId": "uuid (optional)"
  }
  ```

### 4.7 List Products Associated with Discount
- **Method**: `GET /api/discounts/:id/products`
- **Roles**: `ADMIN`, `STAFF`, `CUSTOMER`

### 4.8 Remove Product from Discount
- **Method**: `DELETE /api/discounts/:id/products/:productId`
- **Roles**: `ADMIN`, `STAFF`

### 4.9 Validate & Calculate Discount (Eligibility Engine)
- **Method**: `POST /api/discounts/validate`
- **Roles**: `ADMIN`, `STAFF`, `CUSTOMER`
- **Request Body**:
  ```json
  {
    "discountId": "uuid",
    "amount": 1000.00,
    "quantity": 1,
    "scope": "SUBSCRIPTION",
    "productId": "uuid (optional)"
  }
  ```
- **Response (200 OK - Eligible)**:
  ```json
  {
    "success": true,
    "message": "Discount is applicable",
    "data": {
      "eligible": true,
      "discountId": "uuid",
      "discountName": "Summer Welcome 20%",
      "discountType": "PERCENTAGE",
      "discountValue": "20.00",
      "discountAmount": "200.00",
      "finalAmount": "800.00"
    }
  }
  ```
- **Response (200 OK - Ineligible)**:
  ```json
  {
    "success": true,
    "message": "Discount is not applicable",
    "data": {
      "eligible": false,
      "reason": "Minimum purchase of 500.00 required (current: 100.00)",
      "discountAmount": "0.00",
      "finalAmount": "100.00"
    }
  }
  ```
