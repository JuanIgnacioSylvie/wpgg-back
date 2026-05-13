import {
  Injectable,
  Inject,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IRiotRsoIdTokenVerifier,
  RIOT_RSO_ID_TOKEN_VERIFIER,
} from '../../domain/services/riot-rso-id-token-verifier.interface';
import {
  IRiotSignOnService,
  RIOT_SIGN_ON_SERVICE,
} from '../../domain/services/riot-sign-on.service.interface';
import {
  IRsoStateSigner,
  RSO_STATE_SIGNER,
} from '../../domain/services/rso-state-signer.interface';

export type ExchangeRsoCodeInput = {
  code: string;
  state: string;
  includeUserinfo?: boolean;
};

@Injectable()
export class ExchangeRsoCodeUseCase {
  constructor(
    private readonly config: ConfigService,
    @Inject(RSO_STATE_SIGNER) private readonly stateSigner: IRsoStateSigner,
    @Inject(RIOT_SIGN_ON_SERVICE)
    private readonly riotSignOn: IRiotSignOnService,
    @Inject(RIOT_RSO_ID_TOKEN_VERIFIER)
    private readonly idTokenVerifier: IRiotRsoIdTokenVerifier,
  ) {}

  async execute(input: ExchangeRsoCodeInput) {
    if (!this.stateSigner.verify(input.state)) {
      throw new UnauthorizedException('Invalid or expired OAuth state');
    }

    const redirectUri = this.config.get<string>('RIOT_RSO_REDIRECT_URI')?.trim();
    if (!redirectUri) {
      throw new ServiceUnavailableException(
        'RIOT_RSO_REDIRECT_URI is not configured',
      );
    }
    const code = decodeURIComponent(input.code.trim());

    const tokens = await this.riotSignOn.exchangeAuthorizationCode(
      code,
      redirectUri,
    );

    let idTokenClaims: Record<string, unknown> | null = null;
    if (tokens.id_token) {
      idTokenClaims = await this.idTokenVerifier.verify(tokens.id_token);
    }

    let userinfo: { sub: string; cpid?: string } | undefined;
    if (input.includeUserinfo) {
      userinfo = await this.riotSignOn.getUserinfo(tokens.access_token);
    }

    return {
      scope: tokens.scope,
      expires_in: tokens.expires_in,
      token_type: tokens.token_type,
      sub_sid: tokens.sub_sid,
      access_token: tokens.access_token,
      id_token: tokens.id_token,
      refresh_token: tokens.refresh_token,
      id_token_claims: idTokenClaims,
      userinfo,
    };
  }
}
