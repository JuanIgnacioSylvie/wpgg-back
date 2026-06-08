import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from './config/env.config';
import { MissionsWorkerModule } from './modules/missions/presentation/missions-worker.module';
import { HealthModule } from './shared/presentation/health/health.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    SharedModule,
    HealthModule,
    MissionsWorkerModule,
  ],
})
export class AppWorkerModule {}
