-- Rolling 24h offer batches (2 per difficulty, 6 total per batch).
ALTER TABLE "MissionDay" ADD COLUMN "offersGeneratedAt" TIMESTAMP(3);
ALTER TABLE "MissionDay" ADD COLUMN "offersBatchId" TEXT;

CREATE INDEX "MissionDay_userId_offersGeneratedAt_idx" ON "MissionDay"("userId", "offersGeneratedAt");

ALTER TABLE "MissionOffer" ADD COLUMN "batchId" TEXT;

UPDATE "MissionOffer" SET "batchId" = 'legacy-' || "missionDayId" WHERE "batchId" IS NULL;

ALTER TABLE "MissionOffer" ALTER COLUMN "batchId" SET NOT NULL;

DROP INDEX IF EXISTS "MissionOffer_missionDayId_slot_key";

CREATE UNIQUE INDEX "MissionOffer_missionDayId_slot_batchId_key" ON "MissionOffer"("missionDayId", "slot", "batchId");
CREATE INDEX "MissionOffer_missionDayId_batchId_idx" ON "MissionOffer"("missionDayId", "batchId");

-- Anchor existing offer rows to their mission day as a one-off batch.
UPDATE "MissionDay" md
SET
  "offersBatchId" = 'legacy-' || md.id,
  "offersGeneratedAt" = md."createdAt"
WHERE EXISTS (
  SELECT 1 FROM "MissionOffer" mo WHERE mo."missionDayId" = md.id
)
AND md."offersBatchId" IS NULL;
