-- Missions already rewarded before claim flow should stay in pass missions.
UPDATE "UserMission" SET status = 'CLAIMED' WHERE status = 'COMPLETED';
