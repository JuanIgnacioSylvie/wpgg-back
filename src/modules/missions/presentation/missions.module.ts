import { Module } from '@nestjs/common';
import { AuthModule } from '@modules/auth/presentation/auth.module';
import { RiotModule } from '@modules/riot/presentation/riot.module';
import { SharedModule } from '@shared/shared.module';
import { PrismaWalletRepository } from '@modules/wallet/infrastructure/persistence/prisma-wallet.repository';
import { AcceptMissionOfferUseCase } from '../application/accept-mission-offer.use-case';
import { GetMissionsByDayUseCase } from '../application/get-missions-by-day.use-case';
import { GetMissionsHomeUseCase } from '../application/get-missions-home.use-case';
import { GetPickTodayUseCase } from '../application/get-pick-today.use-case';
import { MissionExpiryScheduler } from '../application/mission-expiry.scheduler';
import { MissionOfferGeneratorService } from '../application/mission-offer-generator.service';
import { MissionSyncScheduler } from '../application/mission-sync.scheduler';
import { RerollMissionOfferUseCase } from '../application/reroll-mission-offer.use-case';
import { SyncUserMatchesUseCase } from '../application/sync-user-matches.use-case';
import { UserMissionContextService } from '../application/user-mission-context.service';
import { PrismaMissionsRepository } from '../infrastructure/persistence/prisma-missions.repository';
import { MissionsController } from './missions.controller';

@Module({
  imports: [SharedModule, AuthModule, RiotModule],
  controllers: [MissionsController],
  providers: [
    PrismaMissionsRepository,
    PrismaWalletRepository,
    MissionOfferGeneratorService,
    UserMissionContextService,
    SyncUserMatchesUseCase,
    GetMissionsHomeUseCase,
    GetMissionsByDayUseCase,
    GetPickTodayUseCase,
    AcceptMissionOfferUseCase,
    RerollMissionOfferUseCase,
    MissionSyncScheduler,
    MissionExpiryScheduler,
  ],
})
export class MissionsModule {}
