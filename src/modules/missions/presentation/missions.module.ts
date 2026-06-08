import { Module } from '@nestjs/common';
import { AuthModule } from '@modules/auth/presentation/auth.module';
import { MissionsController } from './missions.controller';
import { MissionsCoreModule } from './missions-core.module';

@Module({
  imports: [MissionsCoreModule, AuthModule],
  controllers: [MissionsController],
})
export class MissionsModule {}
