-- CreateEnum
CREATE TYPE "CheckoutSessionStatus" AS ENUM ('CREATED', 'CUSTOMER_SET', 'PAYMENT_SELECTED', 'EXPIRED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'CARD', 'CRYPTO');

-- CreateTable
CREATE TABLE "CheckoutSession" (
    "id" TEXT NOT NULL,
    "checkoutLinkId" TEXT NOT NULL,
    "status" "CheckoutSessionStatus" NOT NULL DEFAULT 'CREATED',
    "customerName" TEXT,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "selectedMethod" "PaymentMethod",
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckoutSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CheckoutSession_checkoutLinkId_idx" ON "CheckoutSession"("checkoutLinkId");

-- CreateIndex
CREATE INDEX "CheckoutSession_customerEmail_idx" ON "CheckoutSession"("customerEmail");

-- AddForeignKey
ALTER TABLE "CheckoutSession" ADD CONSTRAINT "CheckoutSession_checkoutLinkId_fkey" FOREIGN KEY ("checkoutLinkId") REFERENCES "CheckoutLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
