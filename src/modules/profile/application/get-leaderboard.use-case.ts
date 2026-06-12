import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaProfileRepository } from '../infrastructure/persistence/prisma-profile.repository';

@Injectable()
export class GetLeaderboardUseCase {
  constructor(private readonly repo: PrismaProfileRepository) {}

  async execute(viewerId: string, limit = 50) {
    const viewer = await this.repo.getProfileSettings(viewerId);
    if (!viewer) {
      throw new NotFoundException();
    }
    if (!viewer.profilePublic) {
      throw new ForbiddenException('PRIVATE_VIEWER');
    }

    const capped = Math.min(Math.max(limit, 1), 100);
    const rows = await this.repo.findLeaderboard(capped);

    return rows.map((row, index) => ({
      rank: index + 1,
      userId: row.id,
      balanceWpgg: row.wpggWallet?.balance ?? 0,
      gameName: row.riotAccount!.gameName,
      tagLine: row.riotAccount!.tagLine,
      region: row.riotAccount!.region,
      profileIconId: row.riotAccount!.profileIconId ?? 0,
    }));
  }
}
