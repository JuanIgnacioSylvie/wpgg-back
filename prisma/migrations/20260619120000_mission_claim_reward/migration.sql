-- AlterEnum
-- PostgreSQL requires new enum values to be committed before use.
-- Backfill runs in the next migration.
ALTER TYPE "UserMissionStatus" ADD VALUE IF NOT EXISTS 'CLAIMED';
