-- MissionCategory enum
CREATE TYPE "MissionCategory" AS ENUM (
  'WELCOME',
  'VERSATILE',
  'FARMING',
  'SUPPORT',
  'WINSTREAK',
  'OTP',
  'TOP',
  'JG',
  'MID',
  'BOTTOM',
  'TANK',
  'HEALER',
  'CLUTCH',
  'MULTIKILL',
  'GOLD',
  'OBJECTIVES',
  'ASSASSIN',
  'WARDS'
);

-- New rule types for expanded mission pool
ALTER TYPE "MissionRuleType" ADD VALUE 'WIN_STREAK';
ALTER TYPE "MissionRuleType" ADD VALUE 'GAMES_WIN_STRUCTURE_DAMAGE';
ALTER TYPE "MissionRuleType" ADD VALUE 'GAMES_WIN_DAMAGE_CHAMPIONS';
ALTER TYPE "MissionRuleType" ADD VALUE 'GAMES_WIN_ASSISTS';
ALTER TYPE "MissionRuleType" ADD VALUE 'GAMES_WIN_KILLS';
ALTER TYPE "MissionRuleType" ADD VALUE 'GAMES_WIN_FAST';
ALTER TYPE "MissionRuleType" ADD VALUE 'GAMES_WIN_MULTIKILL';
ALTER TYPE "MissionRuleType" ADD VALUE 'GAMES_WIN_GOLD';
ALTER TYPE "MissionRuleType" ADD VALUE 'GAMES_WIN_FIRST_TOWER';
ALTER TYPE "MissionRuleType" ADD VALUE 'GAMES_WIN_DEATHS_MAX';
ALTER TYPE "MissionRuleType" ADD VALUE 'GAMES_WIN_CS';
ALTER TYPE "MissionRuleType" ADD VALUE 'DAILY_WARDS_PLACED';
ALTER TYPE "MissionRuleType" ADD VALUE 'GAMES_WIN_TOWERS';

ALTER TABLE "MissionTemplate" ADD COLUMN "slug" TEXT;
ALTER TABLE "MissionTemplate" ADD COLUMN "category" "MissionCategory";
ALTER TABLE "MissionTemplate" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;

UPDATE "MissionTemplate"
SET "slug" = 'legacy-' || substr("id"::text, 1, 8)
WHERE "slug" IS NULL;

UPDATE "MissionTemplate"
SET "category" = 'WELCOME'
WHERE "kind" = 'WELCOME' AND "category" IS NULL;

UPDATE "MissionTemplate"
SET "category" = 'VERSATILE'
WHERE "category" IS NULL;

ALTER TABLE "MissionTemplate" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "MissionTemplate" ALTER COLUMN "category" SET NOT NULL;

CREATE UNIQUE INDEX "MissionTemplate_slug_key" ON "MissionTemplate"("slug");

DROP INDEX IF EXISTS "MissionTemplate_difficulty_idx";
CREATE INDEX "MissionTemplate_difficulty_active_idx" ON "MissionTemplate"("difficulty", "active");
