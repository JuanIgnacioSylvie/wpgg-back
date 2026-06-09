-- Enforce non-negative wallet balances at the database level.
ALTER TABLE "WpggWallet"
ADD CONSTRAINT "WpggWallet_balance_non_negative" CHECK ("balance" >= 0);
