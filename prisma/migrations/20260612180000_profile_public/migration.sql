-- AlterTable
ALTER TABLE "User" ADD COLUMN "profilePublic" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "RiotAccount" ADD COLUMN "profileIconId" INTEGER;
