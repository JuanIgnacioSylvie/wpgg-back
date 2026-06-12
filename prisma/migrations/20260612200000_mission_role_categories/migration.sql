-- Replace MissionCategory with role-only values (Top, Jungle, Mid, Bottom, Support, Autofill)

CREATE TYPE "MissionCategory_new" AS ENUM (
  'TOP',
  'JUNGLE',
  'MID',
  'BOTTOM',
  'SUPPORT',
  'AUTOFILL'
);

ALTER TABLE "MissionTemplate" ADD COLUMN "category_new" "MissionCategory_new";

UPDATE "MissionTemplate"
SET "category_new" = CASE
  WHEN "category"::text = 'TOP' THEN 'TOP'::"MissionCategory_new"
  WHEN "category"::text = 'JG' THEN 'JUNGLE'::"MissionCategory_new"
  WHEN "category"::text = 'MID' THEN 'MID'::"MissionCategory_new"
  WHEN "category"::text = 'BOTTOM' THEN 'BOTTOM'::"MissionCategory_new"
  WHEN "category"::text = 'SUPPORT' THEN 'SUPPORT'::"MissionCategory_new"
  ELSE 'AUTOFILL'::"MissionCategory_new"
END;

ALTER TABLE "MissionTemplate" DROP COLUMN "category";
ALTER TABLE "MissionTemplate" RENAME COLUMN "category_new" TO "category";
ALTER TABLE "MissionTemplate" ALTER COLUMN "category" SET NOT NULL;

DROP TYPE "MissionCategory";
ALTER TYPE "MissionCategory_new" RENAME TO "MissionCategory";
