-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE', 'PAUSED', 'CLOSED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('FIXED', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "DiscountScope" AS ENUM ('PRODUCT', 'SUBSCRIPTION', 'BOTH');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'CARD', 'UPI', 'CHEQUE', 'OTHER');

-- DropForeignKey
ALTER TABLE "Customer" DROP CONSTRAINT "Customer_userId_fkey";

-- AlterTable
ALTER TABLE "Customer" ALTER COLUMN "userId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "PlanProduct" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "PlanProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tax" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rate" DECIMAL(5,2) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tax_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "validityDays" INTEGER NOT NULL DEFAULT 30,
    "planId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuotationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationTemplateItem" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "taxId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "QuotationTemplateItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "planId" TEXT,
    "createdById" TEXT,
    "status" "QuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "quotationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discountTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationItem" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "taxId" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "QuotationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "quotationId" TEXT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "nextBillingDate" TIMESTAMP(3),
    "paymentTerms" TEXT,
    "pausedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionItem" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "taxId" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "SubscriptionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionHistory" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "changedById" TEXT,
    "fromStatus" "SubscriptionStatus",
    "toStatus" "SubscriptionStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Discount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "DiscountType" NOT NULL,
    "scope" "DiscountScope" NOT NULL DEFAULT 'BOTH',
    "value" DECIMAL(12,2) NOT NULL,
    "minimumPurchase" DECIMAL(12,2),
    "minimumQuantity" INTEGER,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "maxUses" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Discount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountProduct" (
    "id" TEXT NOT NULL,
    "discountId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,

    CONSTRAINT "DiscountProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionDiscount" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "discountId" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SubscriptionDiscount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountUsage" (
    "id" TEXT NOT NULL,
    "discountId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amountApplied" DECIMAL(12,2) NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscountUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discountTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "amountPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "taxId" TEXT,
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "recordedById" TEXT,
    "method" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanProduct_planId_idx" ON "PlanProduct"("planId");

-- CreateIndex
CREATE INDEX "PlanProduct_productId_idx" ON "PlanProduct"("productId");

-- CreateIndex
CREATE INDEX "Tax_isActive_idx" ON "Tax"("isActive");

-- CreateIndex
CREATE INDEX "QuotationTemplate_name_idx" ON "QuotationTemplate"("name");

-- CreateIndex
CREATE INDEX "QuotationTemplateItem_templateId_idx" ON "QuotationTemplateItem"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_number_key" ON "Quotation"("number");

-- CreateIndex
CREATE INDEX "Quotation_customerId_idx" ON "Quotation"("customerId");

-- CreateIndex
CREATE INDEX "Quotation_status_idx" ON "Quotation"("status");

-- CreateIndex
CREATE INDEX "QuotationItem_quotationId_idx" ON "QuotationItem"("quotationId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_number_key" ON "Subscription"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_quotationId_key" ON "Subscription"("quotationId");

-- CreateIndex
CREATE INDEX "Subscription_customerId_idx" ON "Subscription"("customerId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_nextBillingDate_idx" ON "Subscription"("nextBillingDate");

-- CreateIndex
CREATE INDEX "SubscriptionItem_subscriptionId_idx" ON "SubscriptionItem"("subscriptionId");

-- CreateIndex
CREATE INDEX "SubscriptionHistory_subscriptionId_createdAt_idx" ON "SubscriptionHistory"("subscriptionId", "createdAt");

-- CreateIndex
CREATE INDEX "Discount_isActive_startsAt_endsAt_idx" ON "Discount"("isActive", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "DiscountProduct_discountId_idx" ON "DiscountProduct"("discountId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionDiscount_subscriptionId_discountId_key" ON "SubscriptionDiscount"("subscriptionId", "discountId");

-- CreateIndex
CREATE INDEX "DiscountUsage_customerId_idx" ON "DiscountUsage"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscountUsage_discountId_invoiceId_key" ON "DiscountUsage"("discountId", "invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");

-- CreateIndex
CREATE INDEX "Invoice_customerId_idx" ON "Invoice"("customerId");

-- CreateIndex
CREATE INDEX "Invoice_status_dueDate_idx" ON "Invoice"("status", "dueDate");

-- CreateIndex
CREATE INDEX "Invoice_subscriptionId_idx" ON "Invoice"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_subscriptionId_periodStart_periodEnd_key" ON "Invoice"("subscriptionId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- CreateIndex
CREATE INDEX "Payment_paymentDate_idx" ON "Payment"("paymentDate");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanProduct" ADD CONSTRAINT "PlanProduct_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanProduct" ADD CONSTRAINT "PlanProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanProduct" ADD CONSTRAINT "PlanProduct_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationTemplate" ADD CONSTRAINT "QuotationTemplate_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationTemplateItem" ADD CONSTRAINT "QuotationTemplateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "QuotationTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationTemplateItem" ADD CONSTRAINT "QuotationTemplateItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationTemplateItem" ADD CONSTRAINT "QuotationTemplateItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationTemplateItem" ADD CONSTRAINT "QuotationTemplateItem_taxId_fkey" FOREIGN KEY ("taxId") REFERENCES "Tax"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_taxId_fkey" FOREIGN KEY ("taxId") REFERENCES "Tax"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionItem" ADD CONSTRAINT "SubscriptionItem_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionItem" ADD CONSTRAINT "SubscriptionItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionItem" ADD CONSTRAINT "SubscriptionItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionItem" ADD CONSTRAINT "SubscriptionItem_taxId_fkey" FOREIGN KEY ("taxId") REFERENCES "Tax"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionHistory" ADD CONSTRAINT "SubscriptionHistory_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionHistory" ADD CONSTRAINT "SubscriptionHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountProduct" ADD CONSTRAINT "DiscountProduct_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "Discount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountProduct" ADD CONSTRAINT "DiscountProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountProduct" ADD CONSTRAINT "DiscountProduct_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionDiscount" ADD CONSTRAINT "SubscriptionDiscount_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionDiscount" ADD CONSTRAINT "SubscriptionDiscount_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "Discount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountUsage" ADD CONSTRAINT "DiscountUsage_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "Discount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountUsage" ADD CONSTRAINT "DiscountUsage_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountUsage" ADD CONSTRAINT "DiscountUsage_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_taxId_fkey" FOREIGN KEY ("taxId") REFERENCES "Tax"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
