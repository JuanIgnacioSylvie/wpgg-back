import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaMissionsRepository } from '../infrastructure/persistence/prisma-missions.repository';
import { PrismaWalletRepository } from '@modules/wallet/infrastructure/persistence/prisma-wallet.repository';
import { UserMissionContextService } from './user-mission-context.service';

const CANCEL_COST = 5;

@Injectable()
export class CancelActiveMissionUseCase {
  constructor(
    private readonly repo: PrismaMissionsRepository,
    private readonly walletRepo: PrismaWalletRepository,
    private readonly context: UserMissionContextService,
  ) {}

  async execute(userId: string, missionId: string) {
    await this.context.requireRiotAccount(userId);
    const mission = await this.repo.findUserMissionById(missionId);
    if (!mission || mission.missionDay.userId !== userId) {
      throw new NotFoundException('Mission not found');
    }
    if (mission.status !== 'ACTIVE') {
      throw new BadRequestException('Only active missions can be cancelled');
    }

    const wallet = await this.walletRepo.ensureWallet(userId);
    if (wallet.balance < CANCEL_COST) {
      throw new BadRequestException(
        'Insufficient WPGG balance to cancel mission',
      );
    }

    await this.walletRepo.debit(
      userId,
      CANCEL_COST,
      'MISSION_CANCEL',
      `cancel:${missionId}:${Date.now()}`,
      'Mission cancellation',
    );

    await this.repo.deleteUserMission(missionId);

    return { success: true };
  }
}
