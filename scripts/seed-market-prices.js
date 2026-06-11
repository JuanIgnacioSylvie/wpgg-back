/**
 * Prod-safe refresh for WpggMarketPrice (no ts-node).
 * Upserts the last 14 UTC days so /wallet/market-chart?days=7 returns data.
 * Usage: node scripts/seed-market-prices.js
 */
const { PrismaClient } = require('@prisma/client');

function utcDateDaysAgo(daysAgo) {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - daysAgo,
    ),
  );
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const base = 0.12;
    for (let i = 13; i >= 0; i--) {
      const date = utcDateDaysAgo(i);
      const jitter = (Math.sin(i) * 0.02 + i * 0.003) % 0.05;
      const priceUsd = base + jitter;
      await prisma.wpggMarketPrice.upsert({
        where: { date },
        create: { date, priceUsd },
        update: { priceUsd },
      });
    }
    console.log('Upserted 14 WpggMarketPrice rows (last 14 UTC days).');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
