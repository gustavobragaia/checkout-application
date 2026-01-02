/*
  Warnings:

  - You are about to drop the `CheckoutEvent` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CheckoutEvent" DROP CONSTRAINT "CheckoutEvent_checkoutLinkId_fkey";

-- DropForeignKey
ALTER TABLE "CheckoutEvent" DROP CONSTRAINT "CheckoutEvent_productId_fkey";

-- DropTable
DROP TABLE "CheckoutEvent";

-- DropEnum
DROP TYPE "CheckoutBlockedReason";

-- DropEnum
DROP TYPE "CheckoutEventType";

-- DropEnum
DROP TYPE "PaymentMethodType";
