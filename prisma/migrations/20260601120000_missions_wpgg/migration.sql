-- CreateEnum
CREATE TYPE "MissionDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "MissionRuleType" AS ENUM ('WIN_EACH_ROLE', 'DAILY_CS', 'GAMES_VISION_MIN', 'GAMES_KP_MIN', 'CHAMPION_GAMES_WINS', 'DAILY_WARDS_DESTROYED', 'WIN_STREAK_NO_DEATH', 'GAMES_WIN_STREAK_PENTAKILL', 'WIN_STREAK_EACH_ROLE_NO_DEATH', 'SINGLE_GAME_HEAL_DAMAGE', 'GAMES_DAMAGE_TAKEN_WINS');

-- CreateEnum
CREATE TYPE "UserMissionStatus" AS ENUM ('OFFER', 'ACTIVE', 'COMPLETED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "WpggTransactionType" AS ENUM ('MISSION_REWARD', 'REROLL', 'ADJUSTMENT', 'WITHDRAW_RESERVED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "timezone" TEXT;

-- CreateTable
CREATE TABLE "MissionTemplate" (
    "id" TEXT NOT NULL,
    "difficulty" "MissionDifficulty" NOT NULL,
    "ruleType" "MissionRuleType" NOT NULL,
    "titleEs" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "targetJson" JSONB NOT NULL,
    "rewardWpgg" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MissionTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionDay" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "calendarDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MissionDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionOffer" (
    "id" TEXT NOT NULL,
    "missionDayId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "slot" INTEGER NOT NULL,
    "championId" INTEGER,
    "rerolledFromOfferId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MissionOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMission" (
    "id" TEXT NOT NULL,
    "missionDayId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "offerId" TEXT,
    "status" "UserMissionStatus" NOT NULL DEFAULT 'OFFER',
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "progressJson" JSONB NOT NULL DEFAULT '{}',
    "acceptedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserMission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WpggWallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WpggWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WpggTransaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" "WpggTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "referenceId" TEXT,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WpggTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessedMatch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WpggMarketPrice" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "priceUsd" DECIMAL(12,6) NOT NULL,

    CONSTRAINT "WpggMarketPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MissionTemplate_difficulty_idx" ON "MissionTemplate"("difficulty");

-- CreateIndex
CREATE INDEX "MissionDay_userId_calendarDate_idx" ON "MissionDay"("userId", "calendarDate");

-- CreateIndex
CREATE UNIQUE INDEX "MissionDay_userId_calendarDate_key" ON "MissionDay"("userId", "calendarDate");

-- CreateIndex
CREATE INDEX "MissionOffer_missionDayId_idx" ON "MissionOffer"("missionDayId");

-- CreateIndex
CREATE UNIQUE INDEX "MissionOffer_missionDayId_slot_key" ON "MissionOffer"("missionDayId", "slot");

-- CreateIndex
CREATE UNIQUE INDEX "UserMission_offerId_key" ON "UserMission"("offerId");

-- CreateIndex
CREATE INDEX "UserMission_missionDayId_status_idx" ON "UserMission"("missionDayId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "WpggWallet_userId_key" ON "WpggWallet"("userId");

-- CreateIndex
CREATE INDEX "WpggTransaction_walletId_createdAt_idx" ON "WpggTransaction"("walletId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WpggTransaction_walletId_referenceId_key" ON "WpggTransaction"("walletId", "referenceId");

-- CreateIndex
CREATE INDEX "ProcessedMatch_userId_idx" ON "ProcessedMatch"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessedMatch_userId_matchId_key" ON "ProcessedMatch"("userId", "matchId");

-- CreateIndex
CREATE UNIQUE INDEX "WpggMarketPrice_date_key" ON "WpggMarketPrice"("date");

-- AddForeignKey
ALTER TABLE "MissionDay" ADD CONSTRAINT "MissionDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionOffer" ADD CONSTRAINT "MissionOffer_missionDayId_fkey" FOREIGN KEY ("missionDayId") REFERENCES "MissionDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionOffer" ADD CONSTRAINT "MissionOffer_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "MissionTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMission" ADD CONSTRAINT "UserMission_missionDayId_fkey" FOREIGN KEY ("missionDayId") REFERENCES "MissionDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMission" ADD CONSTRAINT "UserMission_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "MissionTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMission" ADD CONSTRAINT "UserMission_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "MissionOffer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WpggWallet" ADD CONSTRAINT "WpggWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WpggTransaction" ADD CONSTRAINT "WpggTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "WpggWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessedMatch" ADD CONSTRAINT "ProcessedMatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
