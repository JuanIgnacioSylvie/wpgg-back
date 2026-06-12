import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@shared/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { GetLeaderboardUseCase } from '../application/get-leaderboard.use-case';
import { GetProfileSettingsUseCase } from '../application/get-profile-settings.use-case';
import { GetUserProfileUseCase } from '../application/get-user-profile.use-case';
import { UpdateProfileSettingsUseCase } from '../application/update-profile-settings.use-case';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(
    private readonly getSettings: GetProfileSettingsUseCase,
    private readonly updateProfileSettings: UpdateProfileSettingsUseCase,
    private readonly getUserProfile: GetUserProfileUseCase,
    private readonly getLeaderboard: GetLeaderboardUseCase,
  ) {}

  @Get('settings')
  settings(@CurrentUser() userId: string) {
    return this.getSettings.execute(userId);
  }

  @Patch('settings')
  updateSettings(
    @CurrentUser() userId: string,
    @Body() body: { profilePublic?: boolean },
  ) {
    return this.updateProfileSettings.execute(
      userId,
      body.profilePublic === true,
    );
  }

  @Get('users/:userId')
  userProfile(
    @CurrentUser() viewerId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.getUserProfile.execute(viewerId, targetUserId);
  }

  @Get('leaderboard')
  leaderboard(
    @CurrentUser() userId: string,
    @Query('limit') limit?: string,
  ) {
    const n = limit ? parseInt(limit, 10) : 50;
    return this.getLeaderboard.execute(
      userId,
      Number.isNaN(n) ? 50 : n,
    );
  }
}
