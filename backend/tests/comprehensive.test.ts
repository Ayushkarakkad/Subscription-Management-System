import { Server } from "http";
import app from "../src/app";
import { prisma } from "../src/config/database";

const PORT = 5098;
const BASE_URL = `http://localhost:${PORT}/api`;

let server: Server;
let adminToken = "";
let staffToken = "";
let customerToken = "";

let createdProductId = "";
let createdVariantId = "";
let createdPlanId = "";
let createdTaxId = "";
let createdDiscountId = "";
let createdCustomerId = "";
let createdQuotationId = "";
let createdSubscriptionId = "";
let createdInvoiceId = "";

const testResults: { name: string; status: "PASS" | "FAIL"; error?: string }[] = [];

function assert(condition: boolean, name: string, actual?: any) {
  if (condition) {
    testResults.push({ name, status: "PASS" });
    console.log(`  ✅ PASS: ${name}`);
  } else {
    const errorStr = actual !== undefined ? JSON.stringify(actual) : "";
    testResults.push({ name, status: "FAIL", error: errorStr });
    console.error(`  ❌ FAIL: ${name} -> ${errorStr}`);
  }
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

  let data: any = null;
  try {
    data = await res.json();
  } catch {}

  return { status: res.status, data };
}

async function runTestSuite() {
  console.log("\n========================================================");
  console.log("🧪 RUNNING COMPREHENSIVE AUTOMATED INTEGRATION TESTS");
  console.log("========================================================\n");

  // 1. Health check
  console.log("📌 --- System Health ---");
  const health = await request("/health");
  assert(health.status === 200 && health.data?.success === true, "GET /api/health responds with 200");

  // 2. Authentication & Authorization
  console.log("\n📌 --- Authentication & Authorization ---");

  // Login as seeded admin
  const adminLogin = await request("/auth/login", {
    method: "POST",
    body: { email: "admin@brightloop.io", password: "Password123!" }
  });
  assert(adminLogin.status === 200 && !!adminLogin.data?.data?.token, "Admin login successful with JWT");
  adminToken = adminLogin.data?.data?.token;

  // Login as seeded staff
  const staffLogin = await request("/auth/login", {
    method: "POST",
    body: { email: "staff@brightloop.io", password: "Password123!" }
  });
  assert(staffLogin.status === 200 && !!staffLogin.data?.data?.token, "Staff login successful with JWT");
  staffToken = staffLogin.data?.data?.token;

  // Login as seeded customer
  const custLogin = await request("/auth/login", {
    method: "POST",
    body: { email: "customer@brightloop.io", password: "Password123!" }
  });
  assert(custLogin.status === 200 && !!custLogin.data?.data?.token, "Customer login successful with JWT");
  customerToken = custLogin.data?.data?.token;

  // Invalid login credentials
  const badLogin = await request("/auth/login", {
    method: "POST",
    body: { email: "admin@brightloop.io", password: "WrongPassword!" }
  });
  assert(badLogin.status === 401, "Invalid password returns 401 Unauthorized");

  // Customer registration
  const regEmail = `test.user.${Date.now()}@test.io`;
  const registerRes = await request("/auth/register", {
    method: "POST",
    body: {
      name: "Auto Tester",
      email: regEmail,
      password: "SecurePass123!",
      companyName: "Tester Corp"
    }
  });
  assert(registerRes.status === 201 && !!registerRes.data?.data?.token, "User registration creates user & customer profile (201)");

  // Duplicate registration
  const dupReg = await request("/auth/register", {
    method: "POST",
    body: {
      name: "Auto Tester",
      email: regEmail,
      password: "SecurePass123!"
    }
  });
  assert(dupReg.status === 409, "Duplicate email registration returns 409 Conflict");

  // Current user me endpoint
  const meRes = await request("/auth/me", { token: adminToken });
  assert(meRes.status === 200 && meRes.data?.data?.role === "ADMIN", "GET /api/auth/me returns authenticated user details");

  // 3. User Management
  console.log("\n📌 --- User Management (Admin Only) ---");
  const custUsersRes = await request("/users", { token: customerToken });
  assert(custUsersRes.status === 403, "Customer is forbidden from viewing user list (403)");

  const adminUsersRes = await request("/users?page=1&limit=5", { token: adminToken });
  assert(adminUsersRes.status === 200 && Array.isArray(adminUsersRes.data?.data), "Admin can list all system users (200)");

  // 4. Products & Variants
  console.log("\n📌 --- Products & Variants ---");
  const prodCreate = await request("/products", {
    method: "POST",
    token: staffToken,
    body: {
      name: `API Gateway Pro - ${Date.now()}`,
      category: "DEVELOPER_TOOLS",
      salesPrice: 149.00,
      costPrice: 40.00,
      description: "High performance API reverse proxy & rate limiter",
      variants: [
        { name: "Rate Limit", value: "10k req/min", priceExtra: 0 },
        { name: "Rate Limit", value: "100k req/min", priceExtra: 100 }
      ]
    }
  });
  assert(prodCreate.status === 201 && !!prodCreate.data?.data?.id, "Staff can create product with variants (201)");
  createdProductId = prodCreate.data?.data?.id;

  const prodList = await request("/products?search=Gateway", { token: customerToken });
  assert(prodList.status === 200 && prodList.data?.data?.length > 0, "Customer can search active products");

  // Create single variant
  const varCreate = await request(`/products/${createdProductId}/variants`, {
    method: "POST",
    token: adminToken,
    body: { name: "Support Tier", value: "24/7 Dedicated", priceExtra: 250 }
  });
  assert(varCreate.status === 201 && !!varCreate.data?.data?.id, "Add variant to product (201)");
  createdVariantId = varCreate.data?.data?.id;

  // 5. Taxes & Discounts
  console.log("\n📌 --- Taxes & Discounts ---");
  const taxCreate = await request("/taxes", {
    method: "POST",
    token: adminToken,
    body: { name: `Test Tax ${Date.now()}`, rate: 10.0, description: "10% test tax" }
  });
  assert(taxCreate.status === 201 && !!taxCreate.data?.data?.id, "Admin creates tax configuration (201)");
  createdTaxId = taxCreate.data?.data?.id;

  const discCreate = await request("/discounts", {
    method: "POST",
    token: adminToken,
    body: {
      name: `Promo 20% Off ${Date.now()}`,
      type: "PERCENTAGE",
      value: 20.0,
      minimumPurchase: 100.0,
      isActive: true
    }
  });
  assert(discCreate.status === 201 && !!discCreate.data?.data?.id, "Admin creates 20% discount (201)");
  createdDiscountId = discCreate.data?.data?.id;

  // Discount validation calculation
  const discValid = await request("/discounts/validate", {
    method: "POST",
    token: customerToken,
    body: {
      discountId: createdDiscountId,
      amount: 200.0
    }
  });
  assert(
    discValid.status === 200 &&
    discValid.data?.data?.eligible === true &&
    discValid.data?.data?.discountAmount === 40.0 &&
    discValid.data?.data?.finalAmount === 160.0,
    "Discount validator computes 20% off 200 = 40 (final 160)"
  );

  // 6. Subscription Plans
  console.log("\n📌 --- Subscription Plans ---");
  const planCreate = await request("/plans", {
    method: "POST",
    token: adminToken,
    body: {
      name: `Enterprise Developer Plan ${Date.now()}`,
      description: "Complete developer platform",
      price: 399.00,
      billingInterval: "MONTHLY",
      trialPeriodDays: 7,
      products: [
        { productId: createdProductId, quantity: 1, unitPrice: 149.00 }
      ]
    }
  });
  assert(planCreate.status === 201 && !!planCreate.data?.data?.id, "Admin creates subscription plan with products (201)");
  createdPlanId = planCreate.data?.data?.id;

  // 7. Customers
  console.log("\n📌 --- Customers ---");
  const custCreate = await request("/customers", {
    method: "POST",
    token: staffToken,
    body: {
      name: "Robert Downey",
      companyName: "Stark Industries",
      email: `tony.${Date.now()}@stark.io`,
      phone: "+1 555-0199",
      city: "Malibu",
      state: "CA",
      country: "USA"
    }
  });
  assert(custCreate.status === 201 && !!custCreate.data?.data?.id, "Staff creates new customer record (201)");
  createdCustomerId = custCreate.data?.data?.id;

  // 8. Quotations & Conversion
  console.log("\n📌 --- Quotations & Lifecycle ---");
  const quoteCreate = await request("/quotations", {
    method: "POST",
    token: staffToken,
    body: {
      customerId: createdCustomerId,
      planId: createdPlanId,
      discountTotal: 20.0,
      notes: "Custom enterprise proposal",
      items: [
        {
          productId: createdProductId,
          taxId: createdTaxId,
          quantity: 2,
          unitPrice: 149.00
        }
      ]
    }
  });
  // 2 * 149 = 298 subtotal; 10% tax = 29.80; discount = 20; total = 307.80
  assert(
    quoteCreate.status === 201 &&
    Number(quoteCreate.data?.data?.subtotal) === 298.0 &&
    Number(quoteCreate.data?.data?.taxTotal) === 29.8 &&
    Number(quoteCreate.data?.data?.total) === 307.8,
    "Quotation computes subtotal (298), tax (29.8), total (307.8)"
  );
  createdQuotationId = quoteCreate.data?.data?.id;

  // Convert Quotation to Subscription
  const convertRes = await request(`/quotations/${createdQuotationId}/convert`, {
    method: "POST",
    token: staffToken
  });
  assert(
    convertRes.status === 201 && !!convertRes.data?.data?.id && convertRes.data?.data?.status === "TRIAL",
    "Convert quotation into active trial subscription (201)"
  );
  createdSubscriptionId = convertRes.data?.data?.id;

  // Duplicate convert prevention
  const dupConvert = await request(`/quotations/${createdQuotationId}/convert`, {
    method: "POST",
    token: staffToken
  });
  assert(dupConvert.status === 400, "Prevent duplicate quotation conversion (400)");

  // 9. Subscription Lifecycle
  console.log("\n📌 --- Subscription Lifecycle (Pause / Resume / Cancel) ---");
  const pauseRes = await request(`/subscriptions/${createdSubscriptionId}/pause`, {
    method: "POST",
    token: staffToken,
    body: { note: "Client temporary vacation pause" }
  });
  assert(pauseRes.status === 200 && pauseRes.data?.data?.status === "PAUSED", "Pause subscription");

  const resumeRes = await request(`/subscriptions/${createdSubscriptionId}/resume`, {
    method: "POST",
    token: staffToken,
    body: { note: "Client returned" }
  });
  assert(resumeRes.status === 200 && resumeRes.data?.data?.status === "ACTIVE", "Resume subscription");

  // 10. Automated Recurring Billing Engine
  console.log("\n📌 --- Automated Recurring Billing Engine ---");
  // Set next billing date of this subscription to past to trigger billing
  await prisma.subscription.update({
    where: { id: createdSubscriptionId },
    data: {
      nextBillingDate: new Date(Date.now() - 3600000) // 1 hour ago
    }
  });

  const billingRun = await request("/subscriptions/run-billing-cycle", {
    method: "POST",
    token: adminToken
  });
  assert(
    billingRun.status === 200 && billingRun.data?.data?.invoicesGenerated >= 1,
    "Run billing cycle generates invoice for due subscription"
  );

  // Run billing cycle again immediately to test idempotency / duplicate prevention
  const billingRun2 = await request("/subscriptions/run-billing-cycle", {
    method: "POST",
    token: adminToken
  });
  assert(
    billingRun2.status === 200,
    "Subsequent billing run is idempotent (no duplicate invoices generated)"
  );

  // 11. Invoices & Payments
  console.log("\n📌 --- Invoices & Payments ---");
  const invoicesList = await request(`/invoices?customerId=${createdCustomerId}`, {
    token: staffToken
  });
  assert(
    invoicesList.status === 200 && invoicesList.data?.data?.length > 0,
    "Fetch generated customer invoices"
  );
  createdInvoiceId = invoicesList.data?.data?.[0]?.id;

  // Partial Payment
  const partialPay = await request("/payments", {
    method: "POST",
    token: staffToken,
    body: {
      invoiceId: createdInvoiceId,
      amount: 100.0,
      method: "CARD",
      reference: "CC-PARTIAL-100"
    }
  });
  assert(
    partialPay.status === 201,
    "Record partial payment ($100)"
  );

  // Verify invoice status is now PARTIALLY_PAID
  const invVerify = await request(`/invoices/${createdInvoiceId}`, {
    token: staffToken
  });
  assert(
    invVerify.status === 200 &&
    invVerify.data?.data?.status === "PARTIALLY_PAID" &&
    Number(invVerify.data?.data?.amountPaid) === 100.0,
    "Invoice status transitioned to PARTIALLY_PAID ($100 paid)"
  );

  // Overpayment check (should fail)
  const overPay = await request("/payments", {
    method: "POST",
    token: staffToken,
    body: {
      invoiceId: createdInvoiceId,
      amount: 999999.0
    }
  });
  assert(overPay.status === 400, "Overpayment exceeding balance is rejected with 400");

  // 12. Analytics
  console.log("\n📌 --- Analytics & Financial Reporting ---");
  const overview = await request("/analytics/overview", { token: adminToken });
  assert(
    overview.status === 200 &&
    typeof overview.data?.data?.metrics?.mrr === "number" &&
    typeof overview.data?.data?.metrics?.arr === "number",
    "Admin analytics overview computes valid MRR and ARR"
  );

  const staffDash = await request("/analytics/staff", { token: staffToken });
  assert(staffDash.status === 200 && staffDash.data?.data?.assignedCustomers, "Staff dashboard returns assigned customers and pending quotations");

  // 13. System Settings
  console.log("\n📌 --- System Settings ---");
  const sysSettings = await request("/settings/system", { token: adminToken });
  assert(sysSettings.status === 200 && sysSettings.data?.data?.companyName === "Brightloop Software Inc.", "Retrieve company system settings");

  console.log("\n========================================================");
  const total = testResults.length;
  const passed = testResults.filter((t) => t.status === "PASS").length;
  const failed = testResults.filter((t) => t.status === "FAIL").length;
  console.log(`🎯 TEST RESULTS: ${passed}/${total} PASSED (${failed} FAILED)`);
  console.log("========================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

async function main() {
  server = app.listen(PORT, async () => {
    try {
      await runTestSuite();
    } catch (err) {
      console.error("Test execution encountered fatal error:", err);
      process.exit(1);
    } finally {
      server.close();
      await prisma.$disconnect();
      process.exit(0);
    }
  });
}

main();

