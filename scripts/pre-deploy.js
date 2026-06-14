const { spawnSync } = require('child_process');

const mode = (process.env.APP_MODE || 'api').toLowerCase();

if (mode === 'worker') {
  console.log('[pre-deploy] Skipping prisma migrate deploy on worker service');
  process.exit(0);
}

console.log('[pre-deploy] Running prisma migrate deploy on api service');
const result = spawnSync(
  'node',
  ['./node_modules/prisma/build/index.js', 'migrate', 'deploy'],
  { stdio: 'inherit' },
);
process.exit(result.status ?? 1);
