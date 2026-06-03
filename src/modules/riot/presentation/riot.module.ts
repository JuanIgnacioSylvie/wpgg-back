import { Module, forwardRef } from '@nestjs/common';
import { SharedModule } from '@shared/shared.module';
import { AuthModule } from '../../auth/presentation/auth.module';
import { ExchangeRsoCodeUseCase } from '../application/use-cases/exchange-rso-code.use-case';
import { GetRsoAuthorizeUrlUseCase } from '../application/use-cases/get-rso-authorize-url.use-case';
import { GetRsoUserinfoUseCase } from '../application/use-cases/get-rso-userinfo.use-case';
import { GetMatchHistoryUseCase } from '../application/use-cases/get-match-history.use-case';
import { GetRankedStatsUseCase } from '../application/use-cases/get-ranked-stats.use-case';
import { GetSummonerProfileUseCase } from '../application/use-cases/get-summoner-profile.use-case';
import { ApplyRiotPendingLinkUseCase } from '../application/use-cases/apply-riot-pending-link.use-case';
import { LinkRiotAccountFromRsoUseCase } from '../application/use-cases/link-riot-account-from-rso.use-case';
import { LinkRiotAccountUseCase } from '../application/use-cases/link-riot-account.use-case';
import { RefreshRsoTokensUseCase } from '../application/use-cases/refresh-rso-tokens.use-case';
import { RIOT_ACCOUNT_REPOSITORY } from '../domain/repositories/riot-account.repository.interface';
import { RIOT_SIGN_ON_SERVICE } from '../domain/services/riot-sign-on.service.interface';
import { RIOT_RSO_ID_TOKEN_VERIFIER } from '../domain/services/riot-rso-id-token-verifier.interface';
import { RSO_STATE_SIGNER } from '../domain/services/rso-state-signer.interface';
import { RIOT_SERVICE } from '../domain/services/riot.service.interface';
import { RsoStateSigner } from '../infrastructure/rso-state.signer';
import { PrismaRiotAccountRepository } from '../infrastructure/persistence/prisma-riot-account.repository';
import { RiotRsoIdTokenVerifier } from '../infrastructure/services/riot-rso-id-token.verifier';
import { RiotSignOnAxiosService } from '../infrastructure/services/riot-sign-on-axios.service';
import { RiotServiceAxios } from '../infrastructure/services/riot-service-axios';
import { RiotController } from './riot.controller';
import { RiotRsoController } from './riot-rso.controller';

@Module({
  imports: [SharedModule, forwardRef(() => AuthModule)],
  exports: [
    RIOT_SERVICE,
    RIOT_ACCOUNT_REPOSITORY,
    RIOT_SIGN_ON_SERVICE,
    ApplyRiotPendingLinkUseCase,
    LinkRiotAccountFromRsoUseCase,
    GetRsoAuthorizeUrlUseCase,
  ],
  controllers: [RiotController, RiotRsoController],
  providers: [
    { provide: RIOT_ACCOUNT_REPOSITORY, useClass: PrismaRiotAccountRepository },
    { provide: RIOT_SERVICE, useClass: RiotServiceAxios },
    { provide: RIOT_SIGN_ON_SERVICE, useClass: RiotSignOnAxiosService },
    { provide: RSO_STATE_SIGNER, useClass: RsoStateSigner },
    { provide: RIOT_RSO_ID_TOKEN_VERIFIER, useClass: RiotRsoIdTokenVerifier },
    GetRsoAuthorizeUrlUseCase,
    ExchangeRsoCodeUseCase,
    RefreshRsoTokensUseCase,
    GetRsoUserinfoUseCase,
    LinkRiotAccountUseCase,
    LinkRiotAccountFromRsoUseCase,
    ApplyRiotPendingLinkUseCase,
    GetSummonerProfileUseCase,
    GetMatchHistoryUseCase,
    GetRankedStatsUseCase,
  ],
})
export class RiotModule {}
