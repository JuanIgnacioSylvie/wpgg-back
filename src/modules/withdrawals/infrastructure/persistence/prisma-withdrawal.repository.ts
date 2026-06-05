import { Injectable } from '@nestjs/common';
import { WithdrawalStatus } from '@prisma/client';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';

@Injectable()
export class PrismaWithdrawalRepository {
  constructor(private readonly prisma: PrismaService) {}

  createPending(
    userId: string,
    walletAddress: string,
    amountWpgg: number,
  ) {
    return this.prisma.withdrawal.create({
      data: {
        userId,
        walletAddress,
        amountWpgg,
        status: WithdrawalStatus.PENDING,
      },
    });
  }

  markCompleted(id: string, txHash: string) {
    return this.prisma.withdrawal.update({
      where: { id },
      data: {
        status: WithdrawalStatus.COMPLETED,
        txHash,
      },
    });
  }

  markFailed(id: string) {
    return this.prisma.withdrawal.update({
      where: { id },
      data: {
        status: WithdrawalStatus.FAILED,
      },
    });
  }
}
