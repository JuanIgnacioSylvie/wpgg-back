const { spawnSync } = require('child_process');

const mode = process.env.APP_MODE || 'api';
const entry =
  mode === 'worker'
    ? 'dist/main-worker'
    : mode === 'all'
      ? 'dist/main'
      : 'dist/main-api';

const result = spawnSync('node', [entry], { stdio: 'inherit' });
process.exit(result.status ?? 1);
