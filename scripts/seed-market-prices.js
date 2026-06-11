/**
 * Prod-safe seed for WpggMarketPrice (no ts-node / no JSON compiler flags).
 * Usage: node scripts/seed-market-prices.js
 */
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const count = await prisma.wpggMarketPrice.count();
    if (count > 0) {
      console.log(`WpggMarketPrice already has ${count} row(s), skipping.`);
      return;
    }

    const base = 0.12;
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - i);
      const jitter = (Math.sin(i) * 0.02 + i * 0.003) % 0.05;
      await prisma.wpggMarketPrice.create({
        data: {
          date: d,
          priceUsd: base + jitter,
        },
      });
    }
    console.log('Seeded 14 WpggMarketPrice rows.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
