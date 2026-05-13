import { Injectable, Inject } from '@nestjs/common';
import {
  IRiotSignOnService,
  RIOT_SIGN_ON_SERVICE,
} from '../../domain/services/riot-sign-on.service.interface';

@Injectable()
export class RefreshRsoTokensUseCase {
  constructor(
    @Inject(RIOT_SIGN_ON_SERVICE)
    private readonly riotSignOn: IRiotSignOnService,
  ) {}

  execute(refreshToken: string, scope?: string) {
    return this.riotSignOn.refreshAccessToken(refreshToken, scope);
  }
}
