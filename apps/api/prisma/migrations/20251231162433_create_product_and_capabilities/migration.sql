-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('BRL', 'USD', 'EUR', 'CAD');

-- CreateEnum
CREATE TYPE "ProductCapabilityType" AS ENUM ('PAY_PIX', 'PAY_CARD', 'PAY_CRYPTO');

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "description" TEXT,
    "priceCents" INTEGER NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'BRL',
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCapability" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "ProductCapabilityType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductCapability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Product_sellerId_idx" ON "Product"("sellerId");

-- CreateIndex
CREATE INDEX "Product_sellerId_isArchived_idx" ON "Product"("sellerId", "isArchived");

-- CreateIndex
CREATE INDEX "ProductCapability_productId_idx" ON "ProductCapability"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCapability_productId_type_key" ON "ProductCapability"("productId", "type");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCapability" ADD CONSTRAINT "ProductCapability_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
