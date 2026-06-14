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
import {
  findSeedLeaderboardUser,
  isSeedLeaderboardUser,
  mergeLeaderboardWithSeedUsers,
  resolveLeaderboardViewer,
} from '../infrastructure/leaderboard-seed-users';
import { PrismaProfileRepository } from '../infrastructure/persistence/prisma-profile.repository';

@Injectable()
export class GetUserProfileUseCase {
  constructor(
    private readonly profileRepo: PrismaProfileRepository,
    private readonly missionsRepo: PrismaMissionsRepository,
    private readonly walletRepo: PrismaWalletRepository,
  ) {}

  async execute(viewerId: string, targetUserId: string) {
    const viewer = await this.profileRepo.getProfileSettings(viewerId);
    if (!viewer) {
      throw new NotFoundException();
    }

    if (isSeedLeaderboardUser(targetUserId)) {
      return this.buildSeedUserProfile(viewerId, viewer.profilePublic, targetUserId);
    }

    const target = await this.profileRepo.findUserForProfile(targetUserId);
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
    const completedMissionsCount =
      await this.missionsRepo.countCompletedMissionsForUser(targetUserId);
    const leaderboardContext = await this.resolveLeaderboardContext(
      targetUserId,
      wallet.balance,
    );

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
      completedMissionsCount,
      leaderboardRank: leaderboardContext.rank,
      leaderboardInTop: leaderboardContext.inTop,
      gapToAbove: leaderboardContext.gapToAbove,
      gapToLeader: leaderboardContext.gapToLeader,
      welcome,
      primary,
      secondary,
      past,
    };
  }

  private async buildSeedUserProfile(
    viewerId: string,
    viewerProfilePublic: boolean,
    targetUserId: string,
  ) {
    const seedUser = findSeedLeaderboardUser(targetUserId);
    if (!seedUser) {
      throw new NotFoundException();
    }

    const isSelf = viewerId === targetUserId;
    if (!isSelf && !viewerProfilePublic) {
      throw new ForbiddenException('PRIVATE_VIEWER');
    }

    const prices = await this.walletRepo.marketChart(1);
    const latestPriceUsd =
      prices.length > 0 ? Number(prices[prices.length - 1].priceUsd) : 0.17;
    const leaderboardContext = await this.resolveLeaderboardContext(
      seedUser.userId,
      seedUser.balanceWpgg,
    );
    const stats = mergeLeaderboardWithSeedUsers([], 100).find(
      (entry) => entry.userId === seedUser.userId,
    );

    return {
      userId: seedUser.userId,
      profilePublic: true,
      gameName: seedUser.gameName,
      tagLine: seedUser.tagLine,
      region: seedUser.region,
      profileIconId: seedUser.profileIconId,
      balanceWpgg: seedUser.balanceWpgg,
      balanceUsd: Number((seedUser.balanceWpgg * latestPriceUsd).toFixed(2)),
      latestPriceUsd,
      completedMissionsCount: stats?.completedMissionsCount ?? 0,
      leaderboardRank: stats?.rank ?? leaderboardContext.rank,
      leaderboardInTop: leaderboardContext.inTop,
      gapToAbove: leaderboardContext.gapToAbove,
      gapToLeader: leaderboardContext.gapToLeader,
      welcome: null,
      primary: null,
      secondary: [],
      past: [],
    };
  }

  private async resolveLeaderboardContext(userId: string, balance: number) {
    const rows = await this.profileRepo.findLeaderboard(100);
    const realUserIds = rows.map((row) => row.id);
    const [completedCounts, activeSummaries, totalPublic] = await Promise.all([
      this.missionsRepo.countCompletedMissionsByUserIds(realUserIds),
      this.missionsRepo.findPrimaryActiveMissionSummaries(realUserIds),
      this.profileRepo.countPublicLeaderboardPlayers(),
    ]);

    const entries = mergeLeaderboardWithSeedUsers(
      rows.map((row) => {
        const completed = completedCounts.get(row.id) ?? 0;
        const active = activeSummaries.get(row.id);
        return {
          id: row.id,
          balanceWpgg: row.wpggWallet?.balance ?? 0,
          gameName: row.riotAccount!.gameName,
          tagLine: row.riotAccount!.tagLine,
          region: row.riotAccount!.region,
          profileIconId: row.riotAccount!.profileIconId ?? 0,
          stats: active
            ? {
                completedMissionsCount: completed,
                activeMissionTitleEn: active.titleEn,
                activeMissionTitleEs: active.titleEs,
                activeMissionProgressPercent: active.progressPercent,
                activeMissionChampionId: active.championId,
              }
            : {
                completedMissionsCount: completed,
                activeMissionTitleEn: null,
                activeMissionTitleEs: null,
                activeMissionProgressPercent: null,
                activeMissionChampionId: null,
              },
        };
      }),
      100,
    );

    const listed = entries.find((entry) => entry.userId === userId);
    let rank = listed?.rank ?? 0;
    let inTop = listed != null;
    if (!inTop && !isSeedLeaderboardUser(userId)) {
      const ahead = await this.profileRepo.countUsersAheadOfBalance(balance);
      rank = ahead + 1;
    } else if (!inTop && isSeedLeaderboardUser(userId)) {
      const seedEntry = entries.find((entry) => entry.userId === userId);
      rank = seedEntry?.rank ?? 0;
      inTop = seedEntry != null;
    }

    const resolved = resolveLeaderboardViewer(
      entries,
      { userId, balanceWpgg: balance, rank, inTop },
      totalPublic,
    );

    return {
      rank: resolved.rank,
      inTop: resolved.inTop,
      gapToAbove: resolved.gapToAbove,
      gapToLeader: resolved.gapToLeader,
    };
  }
}
