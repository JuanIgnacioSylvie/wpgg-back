import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InsufficientBalanceError } from '@modules/wallet/domain/errors/insufficient-balance.error';
import { WPGG_CANCEL_COST } from '@modules/wallet/domain/wpgg-economy.constants';
import { PrismaWalletRepository } from '@modules/wallet/infrastructure/persistence/prisma-wallet.repository';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { PrismaMissionsRepository } from '../infrastructure/persistence/prisma-missions.repository';
import { UserMissionContextService } from './user-mission-context.service';

@Injectable()
export class CancelActiveMissionUseCase {
  constructor(
    private readonly repo: PrismaMissionsRepository,
    private readonly walletRepo: PrismaWalletRepository,
    private readonly prisma: PrismaService,
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
    if (mission.template.kind === 'WELCOME') {
      throw new BadRequestException('Welcome missions cannot be cancelled');
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await this.walletRepo.debit(
          userId,
          WPGG_CANCEL_COST,
          'MISSION_CANCEL',
          `cancel:${missionId}`,
          'Mission cancellation',
          tx,
        );

        await tx.userMission.delete({ where: { id: missionId } });
      });
    } catch (error) {
      if (error instanceof InsufficientBalanceError) {
        throw new BadRequestException(
          'Insufficient WPGG balance to cancel mission',
        );
      }
      throw error;
    }

    return { success: true };
  }
}
