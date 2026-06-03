-- CreateTable
CREATE TABLE "RiotPendingLinkExchangeCode" (
    "id" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "riotSub" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "cpid" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiotPendingLinkExchangeCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RiotPendingLinkExchangeCode_codeHash_key" ON "RiotPendingLinkExchangeCode"("codeHash");

-- CreateIndex
CREATE INDEX "RiotPendingLinkExchangeCode_expiresAt_idx" ON "RiotPendingLinkExchangeCode"("expiresAt");
