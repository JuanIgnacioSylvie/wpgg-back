import { Module } from '@nestjs/common';
import { NotificationsCoreModule } from '@modules/notifications/presentation/notifications-core.module';
import { RiotModule } from '@modules/riot/presentation/riot.module';
import { SharedModule } from '@shared/shared.module';
import { PrismaWalletRepository } from '@modules/wallet/infrastructure/persistence/prisma-wallet.repository';
import { AcceptMissionOfferUseCase } from '../application/accept-mission-offer.use-case';
import { CancelActiveMissionUseCase } from '../application/cancel-active-mission.use-case';
import { GetMissionsByDayUseCase } from '../application/get-missions-by-day.use-case';
import { GetMissionsHomeUseCase } from '../application/get-missions-home.use-case';
import { GetPickTodayUseCase } from '../application/get-pick-today.use-case';
import { MissionOfferGeneratorService } from '../application/mission-offer-generator.service';
import { RerollMissionOfferUseCase } from '../application/reroll-mission-offer.use-case';
import { SyncUserMatchesUseCase } from '../application/sync-user-matches.use-case';
import { UserMissionContextService } from '../application/user-mission-context.service';
import { WelcomeMissionService } from '../application/welcome-mission.service';
import { PrismaMissionsRepository } from '../infrastructure/persistence/prisma-missions.repository';

@Module({
  imports: [SharedModule, RiotModule, NotificationsCoreModule],
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
    CancelActiveMissionUseCase,
    WelcomeMissionService,
  ],
  exports: [
    PrismaMissionsRepository,
    SyncUserMatchesUseCase,
    PrismaWalletRepository,
    GetMissionsHomeUseCase,
    GetMissionsByDayUseCase,
    GetPickTodayUseCase,
    AcceptMissionOfferUseCase,
    RerollMissionOfferUseCase,
    CancelActiveMissionUseCase,
  ],
})
export class MissionsCoreModule {}
