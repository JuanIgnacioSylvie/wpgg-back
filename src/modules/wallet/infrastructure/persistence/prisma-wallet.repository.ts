import { Injectable } from '@nestjs/common';
import { WpggTransactionType } from '@prisma/client';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';

@Injectable()
export class PrismaWalletRepository {
  constructor(private readonly prisma: PrismaService) {}

  async ensureWallet(userId: string) {
    const existing = await this.prisma.wpggWallet.findUnique({
      where: { userId },
    });
    if (existing) {
      return existing;
    }
    return this.prisma.wpggWallet.create({
      data: { userId, balance: 0 },
    });
  }

  getWallet(userId: string) {
    return this.prisma.wpggWallet.findUnique({
      where: { userId },
    });
  }

  async creditMissionReward(
    userId: string,
    amount: number,
    referenceId: string,
    description: string,
  ) {
    const wallet = await this.ensureWallet(userId);
    const existing = await this.prisma.wpggTransaction.findUnique({
      where: {
        walletId_referenceId: {
          walletId: wallet.id,
          referenceId,
        },
      },
    });
    if (existing) {
      return wallet;
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.wpggTransaction.create({
        data: {
          walletId: wallet.id,
          type: WpggTransactionType.MISSION_REWARD,
          amount,
          referenceId,
          description,
        },
      });
      return tx.wpggWallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      });
    });
  }

  async debit(
    userId: string,
    amount: number,
    type: WpggTransactionType,
    referenceId: string,
    description: string,
  ) {
    const wallet = await this.ensureWallet(userId);
    if (wallet.balance < amount) {
      throw new Error('INSUFFICIENT_BALANCE');
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.wpggTransaction.create({
        data: {
          walletId: wallet.id,
          type,
          amount: -amount,
          referenceId,
          description,
        },
      });
      return tx.wpggWallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      });
    });
  }

  async credit(
    userId: string,
    amount: number,
    type: WpggTransactionType,
    referenceId: string,
    description: string,
  ) {
    const wallet = await this.ensureWallet(userId);
    return this.prisma.$transaction(async (tx) => {
      await tx.wpggTransaction.create({
        data: {
          walletId: wallet.id,
          type,
          amount,
          referenceId,
          description,
        },
      });
      return tx.wpggWallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      });
    });
  }

  listTransactions(
    userId: string,
    filter: 'all' | 'income' | 'expense',
    limit = 50,
  ) {
    return this.prisma.wpggTransaction.findMany({
      where: {
        wallet: { userId },
        ...(filter === 'income' ? { amount: { gt: 0 } } : {}),
        ...(filter === 'expense' ? { amount: { lt: 0 } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  marketChart(days: number) {
    const from = new Date();
    from.setUTCDate(from.getUTCDate() - days);
    return this.prisma.wpggMarketPrice.findMany({
      where: { date: { gte: from } },
      orderBy: { date: 'asc' },
    });
  }
}
