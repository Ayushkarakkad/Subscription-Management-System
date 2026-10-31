import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "./config/database";
import app from "./app";
import { Server } from "http";

const PORT = 5099;
const BASE_URL = `http://localhost:${PORT}/api`;

let server: Server;
let adminToken = "";
let staffToken = "";
let customerToken = "";

let testProductId = "";
let testVariantId = "";
let testPlanId = "";
let testTaxId = "";
let testDiscountId = "";

const results: { test: string; status: "PASS" | "FAIL"; details?: string }[] = [];

function assert(condition: boolean, testName: string, actual?: any) {
  if (condition) {
    results.push({ test: testName, status: "PASS" });
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    const errorDetails = actual !== undefined ? JSON.stringify(actual) : "";
    results.push({ test: testName, status: "FAIL", details: errorDetails });
    console.error(`  ❌ FAIL: ${testName} - Actual: ${errorDetails}`);
  }
}

async function setupUsers() {
  const hashedPassword = await bcrypt.hash("Password123!", 10);

  // Admin user
  let admin = await prisma.user.findUnique({ where: { email: "admin@example.com" } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        name: "Admin User",
        email: "admin@example.com",
        password: hashedPassword,
        role: "ADMIN",
        isActive: true
      }
    });
  }

  // Staff user
  let staff = await prisma.user.findUnique({ where: { email: "staff@example.com" } });
  if (!staff) {
    staff = await prisma.user.create({
      data: {
        name: "Staff User",
        email: "staff@example.com",
        password: hashedPassword,
        role: "STAFF",
        isActive: true
      }
    });
  }

  // Customer user
  let customer = await prisma.user.findUnique({ where: { email: "customer@example.com" } });
  if (!customer) {
    customer = await prisma.user.create({
      data: {
        name: "Customer User",
        email: "customer@example.com",
        password: hashedPassword,
        role: "CUSTOMER",
        isActive: true,
        customer: { create: { companyName: "ACME Corp" } }
      }
    });
  }

  const secret = process.env.JWT_SECRET || "5d3cb0b576e305a22234b671e4aae1cebd22bddbf6f8f58a9e5b8970d0c23bcd688d29481c13e749e91dfa991b62a161";
  adminToken = jwt.sign({ userId: admin.id, role: admin.role }, secret, { expiresIn: "1h" });
  staffToken = jwt.sign({ userId: staff.id, role: staff.role }, secret, { expiresIn: "1h" });
  customerToken = jwt.sign({ userId: customer.id, role: customer.role }, secret, { expiresIn: "1h" });
}

async function request(
  endpoint: string,
  options: {
    method?: string;
    token?: string;
    body?: any;
  } = {}
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  if (options.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  let json: any = null;
  try {
    json = await res.json();
  } catch {
    // empty or non-json
  }

  return { status: res.status, data: json };
}

async function runTests() {
  console.log("\n🚀 STARTING COMPREHENSIVE TEST SUITE FOR MEMBER 3 MODULES...\n");

  // 1. Health check
  const health = await request("/health");
  assert(health.status === 200 && health.data?.success === true, "GET /api/health returns 200");

  // ==========================================
  // MODULE 1: PRODUCT MANAGEMENT
  // ==========================================
  console.log("\n📦 --- TESTING MODULE 1: PRODUCT MANAGEMENT ---");

  // Missing authentication
  const prodNoAuth = await request("/products");
  assert(prodNoAuth.status === 401, "GET /api/products without auth returns 401");

  // Customer cannot create product
  const prodCustCreate = await request("/products", {
    method: "POST",
    token: customerToken,
    body: { name: "Pro Plan", type: "DIGITAL", salesPrice: 100, costPrice: 50 }
  });
  assert(prodCustCreate.status === 403, "POST /api/products with CUSTOMER role returns 403");

  // Invalid input (negative salesPrice)
  const prodInvalid = await request("/products", {
    method: "POST",
    token: adminToken,
    body: { name: "Bad Product", type: "PHYSICAL", salesPrice: -10, costPrice: 5 }
  });
  assert(prodInvalid.status === 400, "POST /api/products with negative price returns 400");

  // Successful product creation with variants
  const prodCreate = await request("/products", {
    method: "POST",
    token: adminToken,
    body: {
      name: "Cloud Storage",
      type: "SERVICE",
      description: "Secure enterprise cloud storage",
      salesPrice: "499.00",
      costPrice: "200.00",
      notes: "Internal notes",
      variants: [
        { name: "Storage", value: "100GB", priceExtra: 0 },
        { name: "Storage", value: "1TB", priceExtra: 500 }
      ]
    }
  });
  assert(prodCreate.status === 201 && prodCreate.data?.data?.id, "POST /api/products creates product with variants (201)");
  testProductId = prodCreate.data?.data?.id;

  // Retrieve products list
  const prodList = await request("/products?page=1&limit=10&search=Cloud", {
    token: customerToken
  });
  assert(
    prodList.status === 200 && Array.isArray(prodList.data?.data) && prodList.data.data.length > 0,
    "GET /api/products with search & pagination returns 200"
  );

  // Retrieve individual product by ID
  const prodGet = await request(`/products/${testProductId}`, { token: customerToken });
  assert(prodGet.status === 200 && prodGet.data?.data?.name === "Cloud Storage", "GET /api/products/:id returns 200");

  // Retrieve nonexistent product
  const prodNotFound = await request("/products/00000000-0000-0000-0000-000000000000", { token: adminToken });
  assert(prodNotFound.status === 404, "GET /api/products/:id with nonexistent ID returns 404");

  // Update product
  const prodUpdate = await request(`/products/${testProductId}`, {
    method: "PUT",
    token: staffToken,
    body: { description: "Updated cloud storage description", salesPrice: "549.00" }
  });
  assert(prodUpdate.status === 200 && Number(prodUpdate.data?.data?.salesPrice) === 549, "PUT /api/products/:id updates product (200)", prodUpdate);

  // Deactivate product
  const prodDeact = await request(`/products/${testProductId}/status`, {
    method: "PATCH",
    token: adminToken,
    body: { isActive: false }
  });
  assert(prodDeact.status === 200 && prodDeact.data?.data?.isActive === false, "PATCH /api/products/:id/status deactivates product (200)");

  // Customer cannot view deactivated product
  const prodCustDeactView = await request(`/products/${testProductId}`, { token: customerToken });
  assert(prodCustDeactView.status === 404, "Customer cannot access deactivated product (404)");

  // Reactivate product
  await request(`/products/${testProductId}/status`, {
    method: "PATCH",
    token: adminToken,
    body: { isActive: true }
  });

  // Create variant on product
  const varCreate = await request(`/products/${testProductId}/variants`, {
    method: "POST",
    token: adminToken,
    body: { name: "Tier", value: "Enterprise", priceExtra: 1500 }
  });
  assert(varCreate.status === 201 && varCreate.data?.data?.id, "POST /api/products/:id/variants creates variant (201)");
  testVariantId = varCreate.data?.data?.id;

  // Duplicate variant
  const varDup = await request(`/products/${testProductId}/variants`, {
    method: "POST",
    token: adminToken,
    body: { name: "Tier", value: "Enterprise", priceExtra: 2000 }
  });
  assert(varDup.status === 409, "POST /api/products/:id/variants with duplicate variant returns 409");

  // List variants
  const varList = await request(`/products/${testProductId}/variants`, { token: customerToken });
  assert(varList.status === 200 && varList.data?.data?.length >= 3, "GET /api/products/:id/variants returns list (200)");

  // Update variant
  const varUpdate = await request(`/products/${testProductId}/variants/${testVariantId}`, {
    method: "PUT",
    token: adminToken,
    body: { priceExtra: 1800 }
  });
  assert(varUpdate.status === 200, "PUT /api/products/:id/variants/:variantId updates variant (200)");

  // Deactivate variant
  const varStatus = await request(`/products/${testProductId}/variants/${testVariantId}/status`, {
    method: "PATCH",
    token: adminToken,
    body: { isActive: false }
  });
  assert(varStatus.status === 200 && varStatus.data?.data?.isActive === false, "PATCH /api/products/:id/variants/:variantId/status changes status (200)");

  // Delete variant
  const varDel = await request(`/products/${testProductId}/variants/${testVariantId}`, {
    method: "DELETE",
    token: adminToken
  });
  assert(varDel.status === 200, "DELETE /api/products/:id/variants/:variantId deletes unreferenced variant (200)");


  // ==========================================
  // MODULE 2: SUBSCRIPTION PLAN MANAGEMENT
  // ==========================================
  console.log("\n📋 --- TESTING MODULE 2: SUBSCRIPTION PLAN MANAGEMENT ---");

  // Customer cannot create plan
  const planCustCreate = await request("/plans", {
    method: "POST",
    token: customerToken,
    body: { name: "Basic Plan", price: 99, billingInterval: "MONTHLY", startDate: new Date().toISOString() }
  });
  assert(planCustCreate.status === 403, "POST /api/plans with CUSTOMER role returns 403");

  // Invalid plan input (end date earlier than start date)
  const planInvalidDate = await request("/plans", {
    method: "POST",
    token: adminToken,
    body: {
      name: "Invalid Plan",
      price: 199,
      billingInterval: "MONTHLY",
      startDate: "2026-06-01T00:00:00.000Z",
      endDate: "2026-05-01T00:00:00.000Z"
    }
  });
  assert(planInvalidDate.status === 400, "POST /api/plans with endDate < startDate returns 400");

  // Successful plan creation
  const planCreate = await request("/plans", {
    method: "POST",
    token: adminToken,
    body: {
      name: "Pro Monthly Subscription",
      description: "Full pro access billed monthly",
      price: "999.00",
      billingInterval: "MONTHLY",
      minimumQuantity: 1,
      startDate: "2026-01-01T00:00:00.000Z",
      endDate: "2027-01-01T00:00:00.000Z",
      autoClose: false,
      allowEarlyClose: true,
      allowPause: true,
      allowRenewal: true,
      products: [
        { productId: testProductId, quantity: 1, unitPrice: "499.00" }
      ]
    }
  });
  assert(planCreate.status === 201 && planCreate.data?.data?.id, "POST /api/plans creates plan with products (201)");
  testPlanId = planCreate.data?.data?.id;

  // Retrieve plans list
  const planList = await request("/plans?page=1&limit=10&billingInterval=MONTHLY", {
    token: customerToken
  });
  assert(
    planList.status === 200 && Array.isArray(planList.data?.data) && planList.data.data.length > 0,
    "GET /api/plans with filter & pagination returns 200"
  );

  // Retrieve individual plan by ID
  const planGet = await request(`/plans/${testPlanId}`, { token: customerToken });
  assert(planGet.status === 200 && planGet.data?.data?.name === "Pro Monthly Subscription", "GET /api/plans/:id returns 200");

  // Update plan
  const planUpdate = await request(`/plans/${testPlanId}`, {
    method: "PUT",
    token: staffToken,
    body: { description: "Updated description", price: "1099.00" }
  });
  assert(planUpdate.status === 200 && Number(planUpdate.data?.data?.price) === 1099, "PUT /api/plans/:id updates plan (200)", planUpdate);

  // Change plan status (deactivate)
  const planDeact = await request(`/plans/${testPlanId}/status`, {
    method: "PATCH",
    token: adminToken,
    body: { isActive: false }
  });
  assert(planDeact.status === 200 && planDeact.data?.data?.isActive === false, "PATCH /api/plans/:id/status deactivates plan (200)");

  // Reactivate plan
  await request(`/plans/${testPlanId}/status`, {
    method: "PATCH",
    token: adminToken,
    body: { isActive: true }
  });

  // Plan product association - duplicate check
  const planDupProd = await request(`/plans/${testPlanId}/products`, {
    method: "POST",
    token: adminToken,
    body: { productId: testProductId, quantity: 2 }
  });
  assert(planDupProd.status === 409, "POST /api/plans/:id/products duplicate product association returns 409");

  // Retrieve plan products
  const planProdsList = await request(`/plans/${testPlanId}/products`, { token: customerToken });
  assert(planProdsList.status === 200 && planProdsList.data?.data?.length > 0, "GET /api/plans/:id/products lists products (200)");

  // Update plan product
  const planProdUpdate = await request(`/plans/${testPlanId}/products/${testProductId}`, {
    method: "PUT",
    token: adminToken,
    body: { quantity: 3, unitPrice: "450.00" }
  });
  assert(planProdUpdate.status === 200 && planProdUpdate.data?.data?.quantity === 3, "PUT /api/plans/:id/products/:productId updates quantity (200)");

  // Remove product from plan
  const planProdDel = await request(`/plans/${testPlanId}/products/${testProductId}`, {
    method: "DELETE",
    token: adminToken
  });
  assert(planProdDel.status === 200, "DELETE /api/plans/:id/products/:productId removes product (200)");


  // ==========================================
  // MODULE 3: TAX MANAGEMENT
  // ==========================================
  console.log("\n💰 --- TESTING MODULE 3: TAX MANAGEMENT ---");

  // Customer cannot view taxes
  const taxCustGet = await request("/taxes", { token: customerToken });
  assert(taxCustGet.status === 403, "GET /api/taxes with CUSTOMER role returns 403");

  // Invalid tax input (rate > 100)
  const taxInvalid = await request("/taxes", {
    method: "POST",
    token: staffToken,
    body: { name: "Excessive Tax", rate: 120 }
  });
  assert(taxInvalid.status === 400, "POST /api/taxes with rate > 100 returns 400");

  // Successful tax creation
  const taxCreate = await request("/taxes", {
    method: "POST",
    token: staffToken,
    body: { name: `GST 18% - ${Date.now()}`, rate: "18.00", description: "Standard GST goods & services rate" }
  });
  assert(taxCreate.status === 201 && taxCreate.data?.data?.id, "POST /api/taxes creates tax (201)");
  testTaxId = taxCreate.data?.data?.id;

  // Duplicate tax name
  const taxDup = await request("/taxes", {
    method: "POST",
    token: staffToken,
    body: { name: taxCreate.data?.data?.name, rate: 18 }
  });
  assert(taxDup.status === 409, "POST /api/taxes duplicate name returns 409");

  // Retrieve taxes list
  const taxList = await request("/taxes?page=1&limit=10", { token: staffToken });
  assert(taxList.status === 200 && taxList.data?.data?.length > 0, "GET /api/taxes returns list (200)");

  // Retrieve individual tax by ID
  const taxGet = await request(`/taxes/${testTaxId}`, { token: staffToken });
  assert(taxGet.status === 200 && Number(taxGet.data?.data?.rate) === 18, "GET /api/taxes/:id returns 200", taxGet);

  // Update tax
  const taxUpdate = await request(`/taxes/${testTaxId}`, {
    method: "PUT",
    token: adminToken,
    body: { description: "Updated tax description", rate: "18.50" }
  });
  assert(taxUpdate.status === 200 && Number(taxUpdate.data?.data?.rate) === 18.5, "PUT /api/taxes/:id updates tax (200)", taxUpdate);

  // Change tax status
  const taxStatus = await request(`/taxes/${testTaxId}/status`, {
    method: "PATCH",
    token: adminToken,
    body: { isActive: false }
  });
  assert(taxStatus.status === 200 && taxStatus.data?.data?.isActive === false, "PATCH /api/taxes/:id/status changes status (200)");


  // ==========================================
  // MODULE 4: DISCOUNT MANAGEMENT
  // ==========================================
  console.log("\n🏷️ --- TESTING MODULE 4: DISCOUNT MANAGEMENT ---");

  // Customer cannot create discount
  const discCustCreate = await request("/discounts", {
    method: "POST",
    token: customerToken,
    body: { name: "Unauthorized Discount", type: "PERCENTAGE", value: 20 }
  });
  assert(discCustCreate.status === 403, "POST /api/discounts with CUSTOMER role returns 403");

  // Invalid discount input (percentage > 100)
  const discInvalid = await request("/discounts", {
    method: "POST",
    token: staffToken,
    body: { name: "Crazy 150% Off", type: "PERCENTAGE", value: 150 }
  });
  assert(discInvalid.status === 400, "POST /api/discounts with percentage > 100 returns 400");

  // Successful discount creation (PERCENTAGE)
  const discCreate = await request("/discounts", {
    method: "POST",
    token: staffToken,
    body: {
      name: "Summer Welcome 20%",
      description: "20% off for new seasonal signups",
      type: "PERCENTAGE",
      scope: "BOTH",
      value: "20.00",
      minimumPurchase: "100.00",
      minimumQuantity: 1,
      startsAt: "2026-01-01T00:00:00.000Z",
      endsAt: "2027-12-31T23:59:59.000Z",
      maxUses: 100,
      isActive: true
    }
  });
  assert(discCreate.status === 201 && discCreate.data?.data?.id, "POST /api/discounts creates percentage discount (201)");
  testDiscountId = discCreate.data?.data?.id;

  // Retrieve discounts list
  const discList = await request("/discounts?page=1&limit=10&type=PERCENTAGE", {
    token: customerToken
  });
  assert(discList.status === 200 && discList.data?.data?.length > 0, "GET /api/discounts returns list (200)");

  // Retrieve individual discount
  const discGet = await request(`/discounts/${testDiscountId}`, { token: customerToken });
  assert(discGet.status === 200 && Number(discGet.data?.data?.value) === 20, "GET /api/discounts/:id returns 200", discGet);

  // Update discount
  const discUpdate = await request(`/discounts/${testDiscountId}`, {
    method: "PUT",
    token: adminToken,
    body: { description: "Updated summer discount description", maxUses: 200 }
  });
  assert(discUpdate.status === 200 && discUpdate.data?.data?.maxUses === 200, "PUT /api/discounts/:id updates discount (200)");

  // Associate product with discount
  const discProdAssoc = await request(`/discounts/${testDiscountId}/products`, {
    method: "POST",
    token: adminToken,
    body: { productId: testProductId }
  });
  assert(discProdAssoc.status === 201, "POST /api/discounts/:id/products associates product (201)");

  // Duplicate association
  const discProdDup = await request(`/discounts/${testDiscountId}/products`, {
    method: "POST",
    token: adminToken,
    body: { productId: testProductId }
  });
  assert(discProdDup.status === 409, "POST /api/discounts/:id/products duplicate association returns 409");

  // List discount products
  const discProdsList = await request(`/discounts/${testDiscountId}/products`, { token: customerToken });
  assert(discProdsList.status === 200 && discProdsList.data?.data?.length > 0, "GET /api/discounts/:id/products returns list (200)");

  // Remove product from discount
  const discProdDel = await request(`/discounts/${testDiscountId}/products/${testProductId}`, {
    method: "DELETE",
    token: adminToken
  });
  assert(discProdDel.status === 200, "DELETE /api/discounts/:id/products/:productId removes association (200)");

  // Validate & Calculate discount (Eligible case: 20% off 500 = 100 discount, 400 final)
  const calcEligible = await request("/discounts/validate", {
    method: "POST",
    token: customerToken,
    body: {
      discountId: testDiscountId,
      amount: 500,
      quantity: 1
    }
  });
  assert(
    calcEligible.status === 200 &&
    calcEligible.data?.data?.eligible === true &&
    Number(calcEligible.data?.data?.discountAmount) === 100 &&
    Number(calcEligible.data?.data?.finalAmount) === 400,
    "POST /api/discounts/validate calculates correct discount and final amount (200)",
    calcEligible
  );

  // Validate & Calculate discount (Ineligible case: below minimumPurchase of 100)
  const calcIneligible = await request("/discounts/validate", {
    method: "POST",
    token: customerToken,
    body: {
      discountId: testDiscountId,
      amount: 50,
      quantity: 1
    }
  });
  assert(
    calcIneligible.status === 200 && calcIneligible.data?.data?.eligible === false,
    "POST /api/discounts/validate enforces minimumPurchase rule (ineligible)"
  );

  // Change discount status
  const discStatus = await request(`/discounts/${testDiscountId}/status`, {
    method: "PATCH",
    token: adminToken,
    body: { isActive: false }
  });
  assert(discStatus.status === 200 && discStatus.data?.data?.isActive === false, "PATCH /api/discounts/:id/status changes status (200)");

  // Summary
  console.log("\n==========================================");
  const total = results.length;
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("==========================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

async function main() {
  server = app.listen(PORT, async () => {
    try {
      await setupUsers();
      await runTests();
    } catch (err) {
      console.error("Test execution failed with error:", err);
      process.exit(1);
    } finally {
      server.close();
      await prisma.$disconnect();
      process.exit(0);
    }
  });
}

main();
