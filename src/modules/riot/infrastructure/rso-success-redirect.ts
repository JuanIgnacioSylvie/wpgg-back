import { ConfigService } from '@nestjs/config';
import type { RsoPlatform } from '../domain/rso-platform';

const DEFAULT_MOBILE_SUCCESS_REDIRECT = 'wpgg://auth/riot-callback';

/** Success redirect after `/riot/rso/oauth2-callback` (web SPA vs mobile deep link). */
export function resolveRsoSuccessRedirectUrl(
  config: ConfigService,
  platform?: RsoPlatform,
): string {
  if (platform === 'mobile') {
    return (
      config.get<string>('RIOT_RSO_MOBILE_SUCCESS_REDIRECT_URL')?.trim() ||
      DEFAULT_MOBILE_SUCCESS_REDIRECT
    );
  }
  return config.get<string>('RIOT_RSO_SUCCESS_REDIRECT_URL')?.trim() ?? '';
}
