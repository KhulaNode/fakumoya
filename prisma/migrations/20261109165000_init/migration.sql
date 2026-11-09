-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('SCHEDULED', 'PACKED', 'DISPATCHED', 'DELIVERED', 'CANCELLED');

-- CreateTable
CREATE TABLE "PaymentEvent" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "paystackCustomerId" TEXT,
    "paystackCode" TEXT,
    "planCode" TEXT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "nextBillingAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Entitlement" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "paymentEventId" TEXT NOT NULL,
    "cycleStart" TIMESTAMP(3) NOT NULL,
    "cycleEnd" TIMESTAMP(3) NOT NULL,
    "loavesGranted" INTEGER NOT NULL DEFAULT 24,
    "deliveriesGranted" INTEGER NOT NULL DEFAULT 12,
    "loavesUsed" INTEGER NOT NULL DEFAULT 0,
    "deliveriesUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Entitlement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Delivery" (
    "id" TEXT NOT NULL,
    "entitlementId" TEXT NOT NULL,
    "deliveryDate" TIMESTAMP(3) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 2,
    "breadType" TEXT NOT NULL DEFAULT 'mixed',
    "zone" TEXT NOT NULL DEFAULT 'seshego',
    "status" "DeliveryStatus" NOT NULL DEFAULT 'SCHEDULED',
    "deliveredAt" TIMESTAMP(3),
    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommissionEntry" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "lineKey" TEXT NOT NULL,
    "saleType" TEXT NOT NULL,
    "grossMinor" INTEGER NOT NULL,
    "commissionMinor" INTEGER NOT NULL,
    "deliveryMinor" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'ZAR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommissionEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentEvent_reference_key" ON "PaymentEvent"("reference");
CREATE UNIQUE INDEX "Entitlement_paymentEventId_key" ON "Entitlement"("paymentEventId");
CREATE UNIQUE INDEX "Entitlement_subscriptionId_cycleStart_key" ON "Entitlement"("subscriptionId", "cycleStart");
CREATE UNIQUE INDEX "Delivery_entitlementId_deliveryDate_key" ON "Delivery"("entitlementId", "deliveryDate");
CREATE UNIQUE INDEX "CommissionEntry_reference_lineKey_key" ON "CommissionEntry"("reference", "lineKey");

ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_paymentEventId_fkey" FOREIGN KEY ("paymentEventId") REFERENCES "PaymentEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_entitlementId_fkey" FOREIGN KEY ("entitlementId") REFERENCES "Entitlement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
