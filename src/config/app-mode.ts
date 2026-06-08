export type AppMode = 'api' | 'worker' | 'all';

export function parseAppMode(value: unknown): AppMode {
  if (value === 'api' || value === 'worker' || value === 'all') {
    return value;
  }
  // Sin APP_MODE explícito → solo API (seguro en Railway sin Redis).
  return 'api';
}

export function getAppMode(): AppMode {
  return parseAppMode(process.env['APP_MODE']);
}

export function isApiMode(): boolean {
  const mode = getAppMode();
  return mode === 'api' || mode === 'all';
}

export function isWorkerMode(): boolean {
  const mode = getAppMode();
  return mode === 'worker' || mode === 'all';
}

export function requiresRedis(): boolean {
  return isWorkerMode();
}
