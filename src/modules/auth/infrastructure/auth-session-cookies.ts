import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

export const REFRESH_TOKEN_COOKIE = 'refreshToken';
export const ACCESS_TOKEN_COOKIE = 'accessToken';

const REFRESH_COOKIE_MAX_AGE_MS_SHORT = 24 * 60 * 60 * 1000;
const REFRESH_COOKIE_MAX_AGE_MS_LONG = 30 * 24 * 60 * 60 * 1000;

type SameSiteOption = 'lax' | 'strict' | 'none';

/** Cross-site SPA → API: production defaults to SameSite=None + Secure. */
export function sessionCookiePolicy(config: ConfigService): {
  sameSite: SameSiteOption;
  secure: boolean;
} {
  const isProd = config.get<string>('NODE_ENV') === 'production';
  const configured = config.get<'none' | 'lax' | 'strict'>(
    'SESSION_COOKIE_SAME_SITE',
  );
  let sameSite: SameSiteOption =
    configured === 'none' || configured === 'lax' || configured === 'strict'
      ? configured
      : isProd
        ? 'none'
        : 'lax';

  const secureOverride = config.get<string>('SESSION_COOKIE_SECURE')?.trim();
  let secure: boolean;
  if (sameSite === 'none') {
    secure = true;
  } else if (secureOverride === 'true') {
    secure = true;
  } else if (secureOverride === 'false') {
    secure = false;
  } else {
    secure = isProd;
  }
  return { sameSite, secure };
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
  const { sameSite, secure } = sessionCookiePolicy(config);
  return {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: rememberMe
      ? REFRESH_COOKIE_MAX_AGE_MS_LONG
      : REFRESH_COOKIE_MAX_AGE_MS_SHORT,
    path: '/',
  };
}

export function accessCookieOptions(config: ConfigService) {
  const { sameSite, secure } = sessionCookiePolicy(config);
  return {
    httpOnly: true,
    secure,
    sameSite,
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
