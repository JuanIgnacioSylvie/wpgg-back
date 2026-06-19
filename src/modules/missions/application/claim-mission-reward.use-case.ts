import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserMissionStatus } from '@prisma/client';
import { PrismaWalletRepository } from '@modules/wallet/infrastructure/persistence/prisma-wallet.repository';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { mapUserMission } from './mission-response.mapper';
import { PrismaMissionsRepository } from '../infrastructure/persistence/prisma-missions.repository';
import { UserMissionContextService } from './user-mission-context.service';

@Injectable()
export class ClaimMissionRewardUseCase {
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
    if (mission.status !== UserMissionStatus.COMPLETED) {
      throw new BadRequestException('Only completed missions can be claimed');
    }

    await this.prisma.$transaction(async (tx) => {
      await this.walletRepo.creditMissionReward(
        userId,
        mission.template.rewardWpgg,
        `mission:${mission.id}`,
        `Mission completed: ${mission.template.titleEn}`,
        tx,
      );

      await tx.userMission.update({
        where: { id: missionId },
        data: { status: UserMissionStatus.CLAIMED },
      });
    });

    const updated = await this.repo.findUserMissionById(missionId);
    if (!updated) {
      throw new NotFoundException('Mission not found');
    }

    return mapUserMission(updated, updated.offer);
  }
}
