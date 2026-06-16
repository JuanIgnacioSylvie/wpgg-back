import { Module } from '@nestjs/common';
import { MissionExpiryProcessor } from '../application/mission-expiry.processor';
import { MissionExpiryScheduler } from '../application/mission-expiry.scheduler';
import { MissionSyncProcessor } from '../application/mission-sync.processor';
import { MissionSyncScheduler } from '../application/mission-sync.scheduler';
import { MissionTemplateBootstrapService } from '../infrastructure/mission-template-bootstrap.service';
import { MissionsCoreModule } from './missions-core.module';
import { MissionsQueueModule } from './missions-queue.module';

@Module({
  imports: [MissionsCoreModule, MissionsQueueModule.register()],
  providers: [
    MissionSyncProcessor,
    MissionExpiryProcessor,
    MissionSyncScheduler,
    MissionExpiryScheduler,
    MissionTemplateBootstrapService,
  ],
})
export class MissionsWorkerModule {}
