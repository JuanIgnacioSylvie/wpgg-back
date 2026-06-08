import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { RsoIntent } from '../../domain/rso-intent';
import type { RsoPlatform } from '../../domain/rso-platform';
import {
  IRsoStateSigner,
  RSO_STATE_SIGNER,
} from '../../domain/services/rso-state-signer.interface';

const AUTHORIZE_URL = 'https://auth.riotgames.com/authorize';

export type GetRsoAuthorizeUrlInput = {
  loginHint?: string;
  uiLocales?: string;
  intent?: RsoIntent;
  wpggUserId?: string;
  platform?: RsoPlatform;
};

@Injectable()
export class GetRsoAuthorizeUrlUseCase {
  constructor(
    private readonly config: ConfigService,
    @Inject(RSO_STATE_SIGNER) private readonly stateSigner: IRsoStateSigner,
  ) {}

  execute(input: GetRsoAuthorizeUrlInput): { authorizeUrl: string; state: string } {
    const clientId = this.config.get<string>('RIOT_RSO_CLIENT_ID')?.trim();
    const redirectUri = this.config.get<string>('RIOT_RSO_REDIRECT_URI')?.trim();
    if (!clientId || !redirectUri) {
      throw new ServiceUnavailableException(
        'Riot Sign On is not configured (RIOT_RSO_CLIENT_ID, RIOT_RSO_REDIRECT_URI)',
      );
    }
    const scopesRaw =
      this.config.get<string>('RIOT_RSO_SCOPES')?.trim() ||
      'openid offline_access cpid';
    const state = this.stateSigner.create(
      input.intent ?? 'login',
      input.wpggUserId,
      input.platform,
    );

    const params = new URLSearchParams({
      redirect_uri: redirectUri,
      client_id: clientId,
      response_type: 'code',
      scope: scopesRaw,
      state,
    });
    if (input.loginHint?.trim()) {
      params.set('login_hint', input.loginHint.trim());
    }
    if (input.uiLocales?.trim()) {
      params.set('ui_locales', input.uiLocales.trim());
    }

    const authorizeUrl = `${AUTHORIZE_URL}?${params.toString()}`;
    return { authorizeUrl, state };
  }
}
