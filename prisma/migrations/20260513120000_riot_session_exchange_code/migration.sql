-- CreateTable
CREATE TABLE "RiotSessionExchangeCode" (
    "id" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiotSessionExchangeCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RiotSessionExchangeCode_codeHash_key" ON "RiotSessionExchangeCode"("codeHash");

-- CreateIndex
CREATE INDEX "RiotSessionExchangeCode_expiresAt_idx" ON "RiotSessionExchangeCode"("expiresAt");

-- AddForeignKey
ALTER TABLE "RiotSessionExchangeCode" ADD CONSTRAINT "RiotSessionExchangeCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
