-- Mission sync cursor on Riot account + cached match payloads for lighter sync.
ALTER TABLE "RiotAccount" ADD COLUMN "lastSyncedAt" TIMESTAMP(3);
ALTER TABLE "RiotAccount" ADD COLUMN "latestMatchId" TEXT;

ALTER TABLE "ProcessedMatch" ADD COLUMN "gameCreation" BIGINT;
ALTER TABLE "ProcessedMatch" ADD COLUMN "matchPayloadJson" JSONB;
