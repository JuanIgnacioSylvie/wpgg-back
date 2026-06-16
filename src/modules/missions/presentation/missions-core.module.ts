import { Module } from '@nestjs/common';
import { NotificationsCoreModule } from '@modules/notifications/presentation/notifications-core.module';
import { RiotServiceModule } from '@modules/riot/presentation/riot-service.module';
import { SharedModule } from '@shared/shared.module';
import { PrismaWalletRepository } from '@modules/wallet/infrastructure/persistence/prisma-wallet.repository';
import { AcceptMissionOfferUseCase } from '../application/accept-mission-offer.use-case';
import { CancelActiveMissionUseCase } from '../application/cancel-active-mission.use-case';
import { GetMissionsByDayUseCase } from '../application/get-missions-by-day.use-case';
import { GetMissionSyncStatusUseCase } from '../application/get-mission-sync-status.use-case';
import { GetMissionsHomeUseCase } from '../application/get-missions-home.use-case';
import { GetPickTodayUseCase } from '../application/get-pick-today.use-case';
import { MissionOfferGeneratorService } from '../application/mission-offer-generator.service';
import { RerollMissionOfferUseCase } from '../application/reroll-mission-offer.use-case';
import { SyncUserMatchesUseCase } from '../application/sync-user-matches.use-case';
import { TriggerMissionSyncUseCase } from '../application/trigger-mission-sync.use-case';
import { UserMissionContextService } from '../application/user-mission-context.service';
import { WelcomeMissionService } from '../application/welcome-mission.service';
import { PrismaMissionsRepository } from '../infrastructure/persistence/prisma-missions.repository';
import { MissionsQueueModule } from './missions-queue.module';

@Module({
  imports: [
    SharedModule,
    RiotServiceModule,
    NotificationsCoreModule,
    MissionsQueueModule.register(),
  ],
  providers: [
    PrismaMissionsRepository,
    PrismaWalletRepository,
    MissionOfferGeneratorService,
    UserMissionContextService,
    SyncUserMatchesUseCase,
    TriggerMissionSyncUseCase,
    GetMissionSyncStatusUseCase,
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
    GetMissionSyncStatusUseCase,
    PrismaWalletRepository,
    GetMissionsHomeUseCase,
    GetMissionsByDayUseCase,
    GetPickTodayUseCase,
    AcceptMissionOfferUseCase,
    RerollMissionOfferUseCase,
    CancelActiveMissionUseCase,
    TriggerMissionSyncUseCase,
  ],
})
export class MissionsCoreModule {}
