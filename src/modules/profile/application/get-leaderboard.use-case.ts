import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaWalletRepository } from '@modules/wallet/infrastructure/persistence/prisma-wallet.repository';
import { LeaderboardResponsePayload } from '../domain/leaderboard.types';
import {
  mergeLeaderboardWithSeedUsers,
  resolveLeaderboardViewer,
} from '../infrastructure/leaderboard-seed-users';
import { PrismaProfileRepository } from '../infrastructure/persistence/prisma-profile.repository';

@Injectable()
export class GetLeaderboardUseCase {
  constructor(
    private readonly repo: PrismaProfileRepository,
    private readonly walletRepo: PrismaWalletRepository,
  ) {}

  async execute(viewerId: string, limit = 50): Promise<LeaderboardResponsePayload> {
    const viewer = await this.repo.getProfileSettings(viewerId);
    if (!viewer) {
      throw new NotFoundException();
    }
    if (!viewer.profilePublic) {
      throw new ForbiddenException('PRIVATE_VIEWER');
    }

    const capped = Math.min(Math.max(limit, 1), 100);
    const rows = await this.repo.findLeaderboard(capped);

    const [viewerWallet, prices, totalPublic] = await Promise.all([
      this.walletRepo.ensureWallet(viewerId),
      this.walletRepo.marketChart(1),
      this.repo.countPublicLeaderboardPlayers(),
    ]);

    const latestPriceUsd =
      prices.length > 0 ? Number(prices[prices.length - 1].priceUsd) : 0.17;

    const entries = mergeLeaderboardWithSeedUsers(
      rows.map((row) => ({
        id: row.id,
        balanceWpgg: row.wpggWallet?.balance ?? 0,
        gameName: row.riotAccount!.gameName,
        tagLine: row.riotAccount!.tagLine,
        region: row.riotAccount!.region,
        profileIconId: row.riotAccount!.profileIconId ?? 0,
      })),
      capped,
    );

    const listed = entries.find((entry) => entry.userId === viewerId);
    let viewerRank = listed?.rank ?? 0;
    let inTop = listed != null;

    if (!inTop) {
      const ahead = await this.repo.countUsersAheadOfBalance(viewerWallet.balance);
      viewerRank = ahead + 1;
    }

    const viewerResolved = resolveLeaderboardViewer(
      entries,
      {
        userId: viewerId,
        balanceWpgg: viewerWallet.balance,
        rank: viewerRank,
        inTop,
      },
      totalPublic,
    );

    return {
      entries,
      viewer: {
        rank: viewerResolved.rank,
        inTop: viewerResolved.inTop,
        balanceWpgg: viewerWallet.balance,
        gapToAbove: viewerResolved.gapToAbove,
        gapToLeader: viewerResolved.gapToLeader,
        totalPlayers: Math.max(totalPublic, entries.length),
      },
      latestPriceUsd,
    };
  }
}
