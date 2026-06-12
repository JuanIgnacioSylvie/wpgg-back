import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  isStandardMission,
  mapUserMission,
  pickPrimaryMission,
  pickSecondaryMissions,
} from '@modules/missions/application/mission-response.mapper';
import { PrismaMissionsRepository } from '@modules/missions/infrastructure/persistence/prisma-missions.repository';
import { PrismaWalletRepository } from '@modules/wallet/infrastructure/persistence/prisma-wallet.repository';
import { PrismaProfileRepository } from '../infrastructure/persistence/prisma-profile.repository';

@Injectable()
export class GetUserProfileUseCase {
  constructor(
    private readonly profileRepo: PrismaProfileRepository,
    private readonly missionsRepo: PrismaMissionsRepository,
    private readonly walletRepo: PrismaWalletRepository,
  ) {}

  async execute(viewerId: string, targetUserId: string) {
    const [viewer, target] = await Promise.all([
      this.profileRepo.getProfileSettings(viewerId),
      this.profileRepo.findUserForProfile(targetUserId),
    ]);

    if (!viewer) {
      throw new NotFoundException();
    }
    if (!target || !target.riotAccount) {
      throw new NotFoundException();
    }

    const isSelf = viewerId === targetUserId;
    if (!isSelf) {
      if (!viewer.profilePublic) {
        throw new ForbiddenException('PRIVATE_VIEWER');
      }
      if (!target.profilePublic) {
        throw new ForbiddenException('PROFILE_NOT_PUBLIC');
      }
    }

    const wallet = await this.walletRepo.ensureWallet(targetUserId);
    const prices = await this.walletRepo.marketChart(1);
    const latestPriceUsd =
      prices.length > 0 ? Number(prices[prices.length - 1].priceUsd) : 0.17;

    const activeMissions =
      await this.missionsRepo.findActiveMissionsForUser(targetUserId);
    const activeCards = activeMissions.map((m) => mapUserMission(m, m.offer));
    const standardActive = activeCards.filter(isStandardMission);
    const primary = pickPrimaryMission(standardActive);
    const secondary = pickSecondaryMissions(standardActive, primary);

    const welcomeRow = await this.missionsRepo.findWelcomeMissionForUser(
      targetUserId,
    );
    const welcome =
      welcomeRow?.status === 'ACTIVE'
        ? mapUserMission(welcomeRow, welcomeRow.offer)
        : null;

    const pastRows = await this.missionsRepo.findPastMissions(targetUserId, 30);
    const past = pastRows.map((m) => mapUserMission(m));

    return {
      userId: target.id,
      profilePublic: target.profilePublic,
      gameName: target.riotAccount.gameName,
      tagLine: target.riotAccount.tagLine,
      region: target.riotAccount.region,
      profileIconId: target.riotAccount.profileIconId ?? 0,
      balanceWpgg: wallet.balance,
      balanceUsd: Number((wallet.balance * latestPriceUsd).toFixed(2)),
      latestPriceUsd,
      welcome,
      primary,
      secondary,
      past,
    };
  }
}
