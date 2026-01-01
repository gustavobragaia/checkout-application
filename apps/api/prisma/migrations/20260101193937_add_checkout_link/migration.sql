-- CreateTable
CREATE TABLE "CheckoutLink" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "slugUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckoutLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CheckoutLink_slugUrl_key" ON "CheckoutLink"("slugUrl");

-- CreateIndex
CREATE INDEX "CheckoutLink_productId_idx" ON "CheckoutLink"("productId");

-- CreateIndex
CREATE INDEX "CheckoutLink_isActive_idx" ON "CheckoutLink"("isActive");

-- CreateIndex
CREATE INDEX "CheckoutLink_expiresAt_idx" ON "CheckoutLink"("expiresAt");

-- AddForeignKey
ALTER TABLE "CheckoutLink" ADD CONSTRAINT "CheckoutLink_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
