import { Module } from '@nestjs/common';
import { QueueModule } from '@shared/infrastructure/queue/queue.module';
import { MissionExpiryProcessor } from '../application/mission-expiry.processor';
import { MissionExpiryProducer } from '../application/mission-expiry.producer';
import { MissionExpiryScheduler } from '../application/mission-expiry.scheduler';
import { MissionSyncProcessor } from '../application/mission-sync.processor';
import { MissionSyncProducer } from '../application/mission-sync.producer';
import { MissionSyncScheduler } from '../application/mission-sync.scheduler';
import { MissionTemplateBootstrapService } from '../infrastructure/mission-template-bootstrap.service';
import { MissionsCoreModule } from './missions-core.module';

@Module({
  imports: [MissionsCoreModule, QueueModule],
  providers: [
    MissionSyncProducer,
    MissionExpiryProducer,
    MissionSyncProcessor,
    MissionExpiryProcessor,
    MissionSyncScheduler,
    MissionExpiryScheduler,
    MissionTemplateBootstrapService,
  ],
})
export class MissionsWorkerModule {}
