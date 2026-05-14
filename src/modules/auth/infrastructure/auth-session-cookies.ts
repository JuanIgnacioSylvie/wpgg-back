import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

export const REFRESH_TOKEN_COOKIE = 'refreshToken';
export const ACCESS_TOKEN_COOKIE = 'accessToken';

const REFRESH_COOKIE_MAX_AGE_MS_SHORT = 24 * 60 * 60 * 1000;
const REFRESH_COOKIE_MAX_AGE_MS_LONG = 30 * 24 * 60 * 60 * 1000;

function secureCookie(config: ConfigService): boolean {
  return config.get<string>('NODE_ENV') === 'production';
}

export function accessCookieMaxAgeMs(config: ConfigService): number {
  const raw = (config.get<string>('JWT_ACCESS_EXPIRY') ?? '15m').trim();
  const match = raw.match(/^(\d+)(ms|s|m|h|d)$/i);
  if (!match) {
    return 15 * 60 * 1000;
  }
  const n = parseInt(match[1], 10);
  const u = match[2].toLowerCase();
  switch (u) {
    case 'ms':
      return n;
    case 's':
      return n * 1000;
    case 'm':
      return n * 60_000;
    case 'h':
      return n * 3_600_000;
    case 'd':
      return n * 86_400_000;
    default:
      return 15 * 60 * 1000;
  }
}

export function refreshCookieOptions(
  config: ConfigService,
  rememberMe: boolean,
) {
  return {
    httpOnly: true,
    secure: secureCookie(config),
    sameSite: 'strict' as const,
    maxAge: rememberMe
      ? REFRESH_COOKIE_MAX_AGE_MS_LONG
      : REFRESH_COOKIE_MAX_AGE_MS_SHORT,
    path: '/',
  };
}

export function accessCookieOptions(config: ConfigService) {
  return {
    httpOnly: true,
    secure: secureCookie(config),
    sameSite: 'strict' as const,
    maxAge: accessCookieMaxAgeMs(config),
    path: '/',
  };
}

export function attachSessionCookies(
  res: Response,
  config: ConfigService,
  tokens: { accessToken: string; refreshToken: string; rememberMe: boolean },
): void {
  res.cookie(
    REFRESH_TOKEN_COOKIE,
    tokens.refreshToken,
    refreshCookieOptions(config, tokens.rememberMe),
  );
  res.cookie(
    ACCESS_TOKEN_COOKIE,
    tokens.accessToken,
    accessCookieOptions(config),
  );
}

export function clearSessionCookies(res: Response, config: ConfigService): void {
  res.clearCookie(REFRESH_TOKEN_COOKIE, refreshCookieOptions(config, false));
  res.clearCookie(ACCESS_TOKEN_COOKIE, accessCookieOptions(config));
}
