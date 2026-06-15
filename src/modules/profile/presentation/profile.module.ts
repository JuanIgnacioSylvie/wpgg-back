import { Module } from '@nestjs/common';
import { MissionsCoreModule } from '@modules/missions/presentation/missions-core.module';
import { AuthModule } from '@modules/auth/presentation/auth.module';
import { WalletModule } from '@modules/wallet/presentation/wallet.module';
import { SharedModule } from '@shared/shared.module';
import { GetLeaderboardUseCase } from '../application/get-leaderboard.use-case';
import { GetProfileSettingsUseCase } from '../application/get-profile-settings.use-case';
import { GetUserProfileUseCase } from '../application/get-user-profile.use-case';
import { UpdateProfileSettingsUseCase } from '../application/update-profile-settings.use-case';
import { PrismaProfileRepository } from '../infrastructure/persistence/prisma-profile.repository';
import { ProfileController } from './profile.controller';

@Module({
  imports: [SharedModule, AuthModule, MissionsCoreModule, WalletModule],
  controllers: [ProfileController],
  providers: [
    PrismaProfileRepository,
    GetProfileSettingsUseCase,
    UpdateProfileSettingsUseCase,
    GetUserProfileUseCase,
    GetLeaderboardUseCase,
  ],
})
export class ProfileModule {}
