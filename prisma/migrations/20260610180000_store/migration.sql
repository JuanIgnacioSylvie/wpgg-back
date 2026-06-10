-- CreateEnum
CREATE TYPE "StoreProductKeyStatus" AS ENUM ('AVAILABLE', 'ASSIGNED');

-- AlterEnum
ALTER TYPE "WpggTransactionType" ADD VALUE 'STORE_PURCHASE';

-- CreateTable
CREATE TABLE "StoreProduct" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameEs" TEXT NOT NULL,
    "rpAmount" INTEGER NOT NULL,
    "priceWpgg" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreProductKey" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "keyValue" TEXT NOT NULL,
    "status" "StoreProductKeyStatus" NOT NULL DEFAULT 'AVAILABLE',
    "assignedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreProductKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "priceWpgg" INTEGER NOT NULL,
    "keyId" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StoreProduct_slug_key" ON "StoreProduct"("slug");

-- CreateIndex
CREATE INDEX "StoreProductKey_productId_status_idx" ON "StoreProductKey"("productId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "StoreOrder_keyId_key" ON "StoreOrder"("keyId");

-- CreateIndex
CREATE INDEX "StoreOrder_userId_createdAt_idx" ON "StoreOrder"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "StoreOrder_userId_idempotencyKey_key" ON "StoreOrder"("userId", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "StoreProductKey" ADD CONSTRAINT "StoreProductKey_productId_fkey" FOREIGN KEY ("productId") REFERENCES "StoreProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreOrder" ADD CONSTRAINT "StoreOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreOrder" ADD CONSTRAINT "StoreOrder_productId_fkey" FOREIGN KEY ("productId") REFERENCES "StoreProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreOrder" ADD CONSTRAINT "StoreOrder_keyId_fkey" FOREIGN KEY ("keyId") REFERENCES "StoreProductKey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
