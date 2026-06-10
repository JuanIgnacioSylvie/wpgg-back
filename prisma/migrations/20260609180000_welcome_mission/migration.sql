-- CreateEnum
CREATE TYPE "MissionTemplateKind" AS ENUM ('STANDARD', 'WELCOME');

-- AlterEnum
ALTER TYPE "MissionRuleType" ADD VALUE 'FLEX_SQUAD_WPGG_WIN';

-- AlterTable
ALTER TABLE "MissionTemplate" ADD COLUMN "kind" "MissionTemplateKind" NOT NULL DEFAULT 'STANDARD';
ALTER TABLE "MissionTemplate" ADD COLUMN "subtitleEs" TEXT;
ALTER TABLE "MissionTemplate" ADD COLUMN "subtitleEn" TEXT;

-- CreateIndex
CREATE INDEX "MissionTemplate_kind_idx" ON "MissionTemplate"("kind");
