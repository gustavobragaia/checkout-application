-- CreateEnum
CREATE TYPE "CheckoutEventType" AS ENUM ('CHECKOUT_VIEW', 'CHECKOUT_BLOCKED', 'PAYMENT_METHOD_SELECTED');

-- CreateEnum
CREATE TYPE "CheckoutBlockedReason" AS ENUM ('LINK_NOT_FOUND', 'LINK_DISABLED', 'LINK_EXPIRED', 'PRODUCT_ARCHIVED');

-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('PAY_PIX', 'PAY_CARD', 'PAY_CRYPTO');

-- CreateTable
CREATE TABLE "CheckoutEvent" (
    "id" TEXT NOT NULL,
    "checkoutLinkId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "CheckoutEventType" NOT NULL,
    "blockedReason" "CheckoutBlockedReason",
    "paymentMethod" "PaymentMethodType",
    "metadata" JSONB,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckoutEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CheckoutEvent_checkoutLinkId_createdAt_idx" ON "CheckoutEvent"("checkoutLinkId", "createdAt");

-- CreateIndex
CREATE INDEX "CheckoutEvent_productId_createdAt_idx" ON "CheckoutEvent"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "CheckoutEvent_type_createdAt_idx" ON "CheckoutEvent"("type", "createdAt");

-- CreateIndex
CREATE INDEX "CheckoutEvent_createdAt_idx" ON "CheckoutEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "CheckoutEvent" ADD CONSTRAINT "CheckoutEvent_checkoutLinkId_fkey" FOREIGN KEY ("checkoutLinkId") REFERENCES "CheckoutLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckoutEvent" ADD CONSTRAINT "CheckoutEvent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
