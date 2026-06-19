const { spawnSync } = require('child_process');

function runPrisma(args, { inherit = false } = {}) {
  return spawnSync(
    'node',
    ['./node_modules/prisma/build/index.js', ...args],
    { stdio: inherit ? 'inherit' : 'pipe', encoding: 'utf-8' },
  );
}

async function resolveFailedMigrations() {
  let PrismaClient;
  try {
    ({ PrismaClient } = require('@prisma/client'));
  } catch {
    console.log(
      '[pre-deploy] Prisma client unavailable; skipping failed migration recovery',
    );
    return;
  }

  const prisma = new PrismaClient();
  try {
    const failed = await prisma.$queryRaw`
      SELECT migration_name
      FROM "_prisma_migrations"
      WHERE finished_at IS NULL
        AND rolled_back_at IS NULL
        AND started_at IS NOT NULL
    `;

    for (const row of failed) {
      const name = row.migration_name;
      console.log(`[pre-deploy] Recovering failed migration: ${name}`);
      const result = runPrisma(
        ['migrate', 'resolve', '--rolled-back', name],
        { inherit: true },
      );
      if ((result.status ?? 1) !== 0) {
        console.error(`[pre-deploy] Failed to mark ${name} as rolled back`);
        process.exit(result.status ?? 1);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const mode = (process.env.APP_MODE || 'api').toLowerCase();

  if (mode === 'worker') {
    console.log('[pre-deploy] Skipping prisma migrate deploy on worker service');
    process.exit(0);
  }

  await resolveFailedMigrations();

  console.log('[pre-deploy] Running prisma migrate deploy on api service');
  const result = runPrisma(['migrate', 'deploy'], { inherit: true });
  process.exit(result.status ?? 1);
}

main().catch((error) => {
  console.error('[pre-deploy] Unexpected error:', error);
  process.exit(1);
});
