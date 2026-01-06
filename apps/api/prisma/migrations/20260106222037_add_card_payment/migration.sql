-- CreateTable
CREATE TABLE "CardPayment" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "brand" TEXT,
    "last4" TEXT,
    "installments" INTEGER,
    "holderName" TEXT,
    "authorizationCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cardNumber" TEXT,
    "CVV" TEXT,

    CONSTRAINT "CardPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CardPayment_paymentId_key" ON "CardPayment"("paymentId");

-- AddForeignKey
ALTER TABLE "CardPayment" ADD CONSTRAINT "CardPayment_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
