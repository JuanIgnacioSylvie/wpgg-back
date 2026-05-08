import { Module } from '@nestjs/common';
import { SharedModule } from '@shared/shared.module';
import { AuthModule } from '../../auth/presentation/auth.module';
import { LinkRiotAccountUseCase } from '../application/use-cases/link-riot-account.use-case';
import { GetSummonerProfileUseCase } from '../application/use-cases/get-summoner-profile.use-case';
import { GetMatchHistoryUseCase } from '../application/use-cases/get-match-history.use-case';
import { GetRankedStatsUseCase } from '../application/use-cases/get-ranked-stats.use-case';
import { RIOT_ACCOUNT_REPOSITORY } from '../domain/repositories/riot-account.repository.interface';
import { RIOT_SERVICE } from '../domain/services/riot.service.interface';
import { PrismaRiotAccountRepository } from '../infrastructure/persistence/prisma-riot-account.repository';
import { RiotServiceAxios } from '../infrastructure/services/riot-service-axios';
import { RiotController } from './riot.controller';

@Module({
  imports: [SharedModule, AuthModule],
  controllers: [RiotController],
  providers: [
    { provide: RIOT_ACCOUNT_REPOSITORY, useClass: PrismaRiotAccountRepository },
    { provide: RIOT_SERVICE, useClass: RiotServiceAxios },
    LinkRiotAccountUseCase,
    GetSummonerProfileUseCase,
    GetMatchHistoryUseCase,
    GetRankedStatsUseCase,
  ],
})
export class RiotModule {}
