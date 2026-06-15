import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from '../redis/redis.module';
import {
  MISSION_EXPIRY_QUEUE,
  MISSION_SYNC_QUEUE,
} from './queue.constants';

@Module({
  imports: [
    RedisModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.getOrThrow<string>('REDIS_URL'),
          connectTimeout: 10_000,
          maxRetriesPerRequest: null,
          retryStrategy: (times: number) =>
            times > 8 ? null : Math.min(times * 300, 2_000),
        },
        prefix: config.get<string>('BULL_PREFIX', 'wpgg'),
      }),
    }),
    BullModule.registerQueue(
      { name: MISSION_SYNC_QUEUE },
      { name: MISSION_EXPIRY_QUEUE },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
