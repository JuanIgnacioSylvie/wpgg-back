import { DynamicModule, Module } from '@nestjs/common';
import { QueueModule } from '@shared/infrastructure/queue/queue.module';
import { MissionExpiryProducer } from '../application/mission-expiry.producer';
import { MissionSyncProducer } from '../application/mission-sync.producer';

/** Registers BullMQ mission queues when REDIS_URL is set (API + worker). */
@Module({})
export class MissionsQueueModule {
  static register(): DynamicModule {
    if (!process.env['REDIS_URL']) {
      return { module: MissionsQueueModule };
    }
    return {
      module: MissionsQueueModule,
      imports: [QueueModule],
      providers: [MissionSyncProducer, MissionExpiryProducer],
      exports: [MissionSyncProducer, MissionExpiryProducer],
    };
  }
}
