import {
  PrismaClient,
  UserRole,
  BillingInterval,
  SubscriptionStatus,
  InvoiceStatus,
  DiscountType,
  DiscountScope,
  TaxType,
  PaymentMethod,
  PaymentStatus,
  QuotationStatus
} from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Brightloop Software Subscription Management System...");

  // 1. Password hash
  const defaultPassword = await bcrypt.hash("Password123!", 10);

  // 2. Users & Roles
  console.log("Creating default users (Admin, Staff, Customer)...");

  const admin = await prisma.user.upsert({
    where: { email: "admin@brightloop.io" },
    update: { password: defaultPassword, role: UserRole.ADMIN, isActive: true },
    create: {
      name: "Alex Vance (Admin)",
      email: "admin@brightloop.io",
      password: defaultPassword,
      role: UserRole.ADMIN,
      isActive: true
    }
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@brightloop.io" },
    update: { password: defaultPassword, role: UserRole.STAFF, isActive: true },
    create: {
      name: "Marcus Cole (Staff)",
      email: "staff@brightloop.io",
      password: defaultPassword,
      role: UserRole.STAFF,
      isActive: true
    }
  });

  const customerUser = await prisma.user.upsert({
    where: { email: "customer@brightloop.io" },
    update: { password: defaultPassword, role: UserRole.CUSTOMER, isActive: true },
    create: {
      name: "Sarah Jenkins",
      email: "customer@brightloop.io",
      password: defaultPassword,
      role: UserRole.CUSTOMER,
      isActive: true
    }
  });

  // 3. Customers
  console.log("Creating customers...");

  const customer1 = await prisma.customer.upsert({
    where: { userId: customerUser.id },
    update: {},
    create: {
      userId: customerUser.id,
      name: "Sarah Jenkins",
      companyName: "Acme Cloud Dynamics",
      email: "customer@brightloop.io",
      phone: "+1 (555) 234-5678",
      address: "742 Evergreen Terrace",
      city: "San Francisco",
      state: "CA",
      country: "USA",
      postalCode: "94107",
      taxNumber: "US-94-1122334",
      status: "ACTIVE",
      notes: "High value enterprise client since 2024"
    }
  });

  const customer2 = await prisma.customer.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "David Sterling",
      companyName: "Nexus Financial Technologies",
      email: "david.sterling@nexusfin.com",
      phone: "+1 (555) 987-6543",
      address: "120 Wall Street, 24th Floor",
      city: "New York",
      state: "NY",
      country: "USA",
      postalCode: "10005",
      taxNumber: "US-13-9988776",
      status: "ACTIVE",
      notes: "Payment via corporate wire transfer"
    }
  });

  const customer3 = await prisma.customer.upsert({
    where: { id: "00000000-0000-0000-0000-000000000003" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000003",
      name: "Elena Rostova",
      companyName: "Quantum Health Labs",
      email: "elena@quantumhealth.io",
      phone: "+44 20 7946 0912",
      address: "15 Baker Street",
      city: "London",
      country: "United Kingdom",
      postalCode: "NW1 6XE",
      taxNumber: "GB-987-6543-21",
      status: "ACTIVE"
    }
  });

  // 4. Products & Variants
  console.log("Creating products & variants...");

  const product1 = await prisma.product.upsert({
    where: { id: "10000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "10000000-0000-0000-0000-000000000001",
      name: "Brightloop Cloud Workspace",
      category: "CLOUD_STORAGE",
      type: "SERVICE",
      description: "Secure collaborative workspace with real-time sync and versioning",
      sku: "BL-CLOUD-01",
      salesPrice: 49.00,
      costPrice: 15.00,
      isActive: true,
      variants: {
        create: [
          { name: "Capacity", value: "500GB", sku: "BL-CLOUD-500", priceExtra: 0 },
          { name: "Capacity", value: "2TB", sku: "BL-CLOUD-2TB", priceExtra: 30 }
        ]
      }
    }
  });

  const product2 = await prisma.product.upsert({
    where: { id: "10000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "10000000-0000-0000-0000-000000000002",
      name: "DevSecOps Pipeline Engine",
      category: "DEVELOPER_TOOLS",
      type: "SERVICE",
      description: "Automated vulnerability scanning, CI/CD runner and compliance reports",
      sku: "BL-DEVOPS-01",
      salesPrice: 199.00,
      costPrice: 50.00,
      isActive: true,
      variants: {
        create: [
          { name: "Concurrency", value: "5 Runners", sku: "BL-RUN-5", priceExtra: 0 },
          { name: "Concurrency", value: "20 Runners", sku: "BL-RUN-20", priceExtra: 150 }
        ]
      }
    }
  });

  const product3 = await prisma.product.upsert({
    where: { id: "10000000-0000-0000-0000-000000000003" },
    update: {},
    create: {
      id: "10000000-0000-0000-0000-000000000003",
      name: "AI Analytics & Intelligence Suite",
      category: "ANALYTICS",
      type: "SERVICE",
      description: "Deep customer insights, revenue forecasting and churn risk modeling",
      sku: "BL-AI-01",
      salesPrice: 299.00,
      costPrice: 90.00,
      isActive: true
    }
  });

  // 5. Taxes
  console.log("Creating taxes...");

  const taxGst = await prisma.tax.upsert({
    where: { id: "20000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "20000000-0000-0000-0000-000000000001",
      name: "Standard GST (18%)",
      rate: 18.00,
      type: TaxType.PERCENTAGE,
      description: "Standard Goods & Services Tax",
      isActive: true
    }
  });

  const taxVat = await prisma.tax.upsert({
    where: { id: "20000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "20000000-0000-0000-0000-000000000002",
      name: "European VAT (20%)",
      rate: 20.00,
      type: TaxType.PERCENTAGE,
      description: "Value Added Tax for EU entities",
      isActive: true
    }
  });

  const taxUsSales = await prisma.tax.upsert({
    where: { id: "20000000-0000-0000-0000-000000000003" },
    update: {},
    create: {
      id: "20000000-0000-0000-0000-000000000003",
      name: "CA State Sales Tax (8.25%)",
      rate: 8.25,
      type: TaxType.PERCENTAGE,
      description: "California state & district tax",
      isActive: true
    }
  });

  // 6. Subscription Plans
  console.log("Creating subscription plans...");

  const planStarter = await prisma.plan.upsert({
    where: { id: "30000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "30000000-0000-0000-0000-000000000001",
      name: "Brightloop Starter Plan",
      description: "Perfect for fast-growing startups and small teams",
      price: 99.00,
      billingInterval: BillingInterval.MONTHLY,
      trialPeriodDays: 14,
      minimumQuantity: 1,
      isActive: true,
      planProducts: {
        create: [
          { productId: product1.id, quantity: 1, unitPrice: 49.00 }
        ]
      }
    }
  });

  const planPro = await prisma.plan.upsert({
    where: { id: "30000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "30000000-0000-0000-0000-000000000002",
      name: "Brightloop Professional Suite",
      description: "Full suite access with DevOps automation and cloud collaboration",
      price: 249.00,
      billingInterval: BillingInterval.MONTHLY,
      trialPeriodDays: 7,
      minimumQuantity: 1,
      isActive: true,
      planProducts: {
        create: [
          { productId: product1.id, quantity: 1, unitPrice: 49.00 },
          { productId: product2.id, quantity: 1, unitPrice: 199.00 }
        ]
      }
    }
  });

  const planEnterprise = await prisma.plan.upsert({
    where: { id: "30000000-0000-0000-0000-000000000003" },
    update: {},
    create: {
      id: "30000000-0000-0000-0000-000000000003",
      name: "Enterprise Annual All-Access",
      description: "Complete platform access, priority support and AI analytics",
      price: 2990.00,
      billingInterval: BillingInterval.YEARLY,
      trialPeriodDays: 0,
      minimumQuantity: 1,
      isActive: true,
      planProducts: {
        create: [
          { productId: product1.id, quantity: 1, unitPrice: 49.00 },
          { productId: product2.id, quantity: 1, unitPrice: 199.00 },
          { productId: product3.id, quantity: 1, unitPrice: 299.00 }
        ]
      }
    }
  });

  // 7. Discounts
  console.log("Creating discounts...");

  await prisma.discount.upsert({
    where: { id: "40000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "40000000-0000-0000-0000-000000000001",
      name: "Early Adopter 15% Off",
      description: "15% discount for early stage innovation partners",
      type: DiscountType.PERCENTAGE,
      scope: DiscountScope.BOTH,
      value: 15.00,
      minimumPurchase: 50.00,
      maxUses: 500,
      isActive: true
    }
  });

  await prisma.discount.upsert({
    where: { id: "40000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "40000000-0000-0000-0000-000000000002",
      name: "Enterprise Welcome $100 Off",
      description: "Flat $100 credit on first order over $500",
      type: DiscountType.FIXED,
      scope: DiscountScope.SUBSCRIPTION,
      value: 100.00,
      minimumPurchase: 500.00,
      isActive: true
    }
  });

  // 8. Subscriptions
  console.log("Creating active subscriptions...");

  const sub1 = await prisma.subscription.upsert({
    where: { number: "SUB-2026-0001" },
    update: {},
    create: {
      number: "SUB-2026-0001",
      customerId: customer1.id,
      planId: planPro.id,
      status: SubscriptionStatus.ACTIVE,
      startDate: new Date("2026-01-01T00:00:00Z"),
      nextBillingDate: new Date("2026-11-01T00:00:00Z"),
      billingAmount: 249.00,
      billingInterval: BillingInterval.MONTHLY,
      paymentTerms: "Net 15",
      items: {
        create: [
          {
            productId: product1.id,
            quantity: 1,
            unitPrice: 49.00,
            taxRate: 8.25,
            lineTotal: 53.04
          },
          {
            productId: product2.id,
            quantity: 1,
            unitPrice: 199.00,
            taxRate: 8.25,
            lineTotal: 215.42
          }
        ]
      },
      history: {
        create: {
          changedById: admin.id,
          fromStatus: null,
          toStatus: SubscriptionStatus.ACTIVE,
          note: "Initial contract activation"
        }
      }
    }
  });

  const sub2 = await prisma.subscription.upsert({
    where: { number: "SUB-2026-0002" },
    update: {},
    create: {
      number: "SUB-2026-0002",
      customerId: customer2.id,
      planId: planEnterprise.id,
      status: SubscriptionStatus.ACTIVE,
      startDate: new Date("2026-03-15T00:00:00Z"),
      nextBillingDate: new Date("2027-03-15T00:00:00Z"),
      billingAmount: 2990.00,
      billingInterval: BillingInterval.YEARLY,
      paymentTerms: "Net 30",
      history: {
        create: {
          changedById: staff.id,
          fromStatus: null,
          toStatus: SubscriptionStatus.ACTIVE,
          note: "Enterprise yearly commitment signed"
        }
      }
    }
  });

  // 9. Invoices
  console.log("Creating invoices...");

  const inv1 = await prisma.invoice.upsert({
    where: { number: "INV-2026-0001" },
    update: {},
    create: {
      number: "INV-2026-0001",
      customerId: customer1.id,
      subscriptionId: sub1.id,
      status: InvoiceStatus.PAID,
      invoiceDate: new Date("2026-09-01T00:00:00Z"),
      dueDate: new Date("2026-09-16T00:00:00Z"),
      currency: "USD",
      subtotal: 248.00,
      taxTotal: 20.46,
      discountTotal: 0,
      total: 268.46,
      amountPaid: 268.46,
      notes: "Payment received via Bank Wire. Thank you!",
      items: {
        create: [
          {
            productId: product1.id,
            description: "Brightloop Cloud Workspace - September 2026",
            quantity: 1,
            unitPrice: 49.00,
            taxRate: 8.25,
            lineTotal: 53.04
          },
          {
            productId: product2.id,
            description: "DevSecOps Pipeline Engine - September 2026",
            quantity: 1,
            unitPrice: 199.00,
            taxRate: 8.25,
            lineTotal: 215.42
          }
        ]
      }
    }
  });

  const inv2 = await prisma.invoice.upsert({
    where: { number: "INV-2026-0002" },
    update: {},
    create: {
      number: "INV-2026-0002",
      customerId: customer1.id,
      subscriptionId: sub1.id,
      status: InvoiceStatus.ISSUED,
      invoiceDate: new Date("2026-10-01T00:00:00Z"),
      dueDate: new Date("2026-10-16T00:00:00Z"),
      currency: "USD",
      subtotal: 248.00,
      taxTotal: 20.46,
      discountTotal: 0,
      total: 268.46,
      amountPaid: 0,
      notes: "Monthly subscription invoice for October 2026",
      items: {
        create: [
          {
            productId: product1.id,
            description: "Brightloop Cloud Workspace - October 2026",
            quantity: 1,
            unitPrice: 49.00,
            taxRate: 8.25,
            lineTotal: 53.04
          },
          {
            productId: product2.id,
            description: "DevSecOps Pipeline Engine - October 2026",
            quantity: 1,
            unitPrice: 199.00,
            taxRate: 8.25,
            lineTotal: 215.42
          }
        ]
      }
    }
  });

  // 10. Payments
  console.log("Recording payments...");

  await prisma.payment.upsert({
    where: { id: "50000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "50000000-0000-0000-0000-000000000001",
      invoiceId: inv1.id,
      customerId: customer1.id,
      recordedById: staff.id,
      method: PaymentMethod.BANK_TRANSFER,
      amount: 268.46,
      paymentDate: new Date("2026-09-05T00:00:00Z"),
      reference: "WIRE-REF-981247",
      note: "Full settlement for invoice INV-2026-0001",
      status: PaymentStatus.COMPLETED
    }
  });

  // 11. Quotations
  console.log("Creating quotations...");

  await prisma.quotation.upsert({
    where: { number: "QT-2026-0001" },
    update: {},
    create: {
      number: "QT-2026-0001",
      customerId: customer3.id,
      planId: planStarter.id,
      createdById: staff.id,
      status: QuotationStatus.SENT,
      validUntil: new Date("2026-11-30T00:00:00Z"),
      subtotal: 99.00,
      taxTotal: 19.80,
      discountTotal: 0,
      total: 118.80,
      notes: "Proposal for Quantum Health Labs 14-day trial evaluation",
      items: {
        create: [
          {
            productId: product1.id,
            quantity: 1,
            unitPrice: 99.00,
            taxRate: 20.00,
            lineTotal: 118.80
          }
        ]
      }
    }
  });

  // 12. System Settings
  console.log("Configuring system settings...");

  const settings = [
    { key: "companyName", value: "Brightloop Software Inc." },
    { key: "companyEmail", value: "billing@brightloop.io" },
    { key: "companyPhone", value: "+1 (800) 555-LOOP" },
    { key: "companyAddress", value: "100 Innovation Boulevard, Tech Park, Suite 400, San Francisco, CA" },
    { key: "defaultCurrency", value: "USD" },
    { key: "defaultPaymentTerms", value: "Net 15" },
    { key: "taxIdentificationNumber", value: "US-EIN-98-7654321" }
  ];

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s
    });
  }

  // 13. Notifications
  console.log("Creating sample notifications...");

  await prisma.notification.createMany({
    data: [
      {
        userId: customerUser.id,
        title: "New Invoice Available",
        message: "Invoice INV-2026-0002 for $268.46 has been issued.",
        type: "BILLING"
      },
      {
        role: UserRole.STAFF,
        title: "Pending Quotation Follow-up",
        message: "Quotation QT-2026-0001 for Quantum Health Labs is awaiting response.",
        type: "QUOTATION"
      },
      {
        role: UserRole.ADMIN,
        title: "Monthly Revenue Update",
        message: "MRR reached $498.00 with 100% collection rate on September billing.",
        type: "ANALYTICS"
      }
    ],
    skipDuplicates: true
  });

  console.log("✅ Database seeding completed successfully!");
  console.log("\n🔑 Default Credentials for Login:");
  console.log("   Admin:    admin@brightloop.io    / Password123!");
  console.log("   Staff:    staff@brightloop.io    / Password123!");
  console.log("   Customer: customer@brightloop.io / Password123!\n");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

