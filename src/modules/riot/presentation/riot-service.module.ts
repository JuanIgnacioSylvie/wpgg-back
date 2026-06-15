import { Module } from '@nestjs/common';
import { SharedModule } from '@shared/shared.module';
import { RIOT_ACCOUNT_REPOSITORY } from '../domain/repositories/riot-account.repository.interface';
import { RIOT_SERVICE } from '../domain/services/riot.service.interface';
import { PrismaRiotAccountRepository } from '../infrastructure/persistence/prisma-riot-account.repository';
import { RiotServiceAxios } from '../infrastructure/services/riot-service-axios';

/** Riot API client only — for missions sync (worker) without auth/link use cases. */
@Module({
  imports: [SharedModule],
  providers: [
    { provide: RIOT_ACCOUNT_REPOSITORY, useClass: PrismaRiotAccountRepository },
    { provide: RIOT_SERVICE, useClass: RiotServiceAxios },
  ],
  exports: [RIOT_SERVICE, RIOT_ACCOUNT_REPOSITORY],
})
export class RiotServiceModule {}
