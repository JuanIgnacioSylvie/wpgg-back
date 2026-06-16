-- Per-mission rolling 24h deadline (from accept time).
ALTER TABLE "UserMission" ADD COLUMN "expiresAt" TIMESTAMP(3);

CREATE INDEX "UserMission_status_expiresAt_idx" ON "UserMission"("status", "expiresAt");

-- Backfill active standard missions so existing users keep a fair window.
UPDATE "UserMission" um
SET
  "acceptedAt" = COALESCE(um."acceptedAt", um."createdAt"),
  "expiresAt" = COALESCE(um."acceptedAt", um."createdAt") + INTERVAL '24 hours'
FROM "MissionTemplate" mt
WHERE um."templateId" = mt.id
  AND um."status" = 'ACTIVE'
  AND mt."kind" = 'STANDARD'
  AND um."expiresAt" IS NULL;
