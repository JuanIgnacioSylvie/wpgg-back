import type { LogLevel } from '@nestjs/common';

const PRODUCTION_LEVELS: LogLevel[] = ['error', 'warn', 'log'];
const DEVELOPMENT_LEVELS: LogLevel[] = [
  'error',
  'warn',
  'log',
  'debug',
  'verbose',
];

export function resolveNestLoggerLevels(): LogLevel[] {
  const configured = process.env.LOG_LEVEL?.trim().toLowerCase();
  if (configured === 'error') return ['error'];
  if (configured === 'warn') return ['error', 'warn'];
  if (configured === 'log') return ['error', 'warn', 'log'];
  if (configured === 'debug') return DEVELOPMENT_LEVELS;
  if (configured === 'verbose') return DEVELOPMENT_LEVELS;

  return process.env.NODE_ENV === 'production'
    ? PRODUCTION_LEVELS
    : DEVELOPMENT_LEVELS;
}

/** Scheduler/processor tick logs: visible in production unless LOG_LEVEL=error|warn. */
export function shouldLogSchedulerTicks(): boolean {
  const configured = process.env.LOG_LEVEL?.trim().toLowerCase();
  if (configured === 'error' || configured === 'warn') return false;
  return true;
}
