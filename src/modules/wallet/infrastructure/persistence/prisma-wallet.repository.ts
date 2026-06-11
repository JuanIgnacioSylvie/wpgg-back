import { Injectable } from '@nestjs/common';
import { Prisma, WpggTransactionType, WpggWallet } from '@prisma/client';
import { InsufficientBalanceError } from '@modules/wallet/domain/errors/insufficient-balance.error';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';

type TxClient = Prisma.TransactionClient;

@Injectable()
export class PrismaWalletRepository {
  constructor(private readonly prisma: PrismaService) {}

  async ensureWallet(userId: string, tx?: TxClient): Promise<WpggWallet> {
    const client = tx ?? this.prisma;
    const existing = await client.wpggWallet.findUnique({
      where: { userId },
    });
    if (existing) {
      return existing;
    }
    return client.wpggWallet.create({
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
    tx?: TxClient,
  ): Promise<WpggWallet> {
    const run = async (client: TxClient) => {
      const wallet = await this.ensureWallet(userId, client);
      const existing = await client.wpggTransaction.findUnique({
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

      await client.wpggTransaction.create({
        data: {
          walletId: wallet.id,
          type: WpggTransactionType.MISSION_REWARD,
          amount,
          referenceId,
          description,
        },
      });
      return client.wpggWallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      });
    };

    if (tx) {
      return run(tx);
    }
    return this.prisma.$transaction(run);
  }

  async debit(
    userId: string,
    amount: number,
    type: WpggTransactionType,
    referenceId: string,
    description: string,
    tx?: TxClient,
  ): Promise<WpggWallet> {
    const run = async (client: TxClient) => {
      const wallet = await this.ensureWallet(userId, client);

      if (referenceId) {
        const existing = await client.wpggTransaction.findUnique({
          where: {
            walletId_referenceId: {
              walletId: wallet.id,
              referenceId,
            },
          },
        });
        if (existing) {
          return client.wpggWallet.findUniqueOrThrow({
            where: { id: wallet.id },
          });
        }
      }

      const updated = await client.wpggWallet.updateMany({
        where: { id: wallet.id, balance: { gte: amount } },
        data: { balance: { decrement: amount } },
      });
      if (updated.count === 0) {
        throw new InsufficientBalanceError();
      }

      await client.wpggTransaction.create({
        data: {
          walletId: wallet.id,
          type,
          amount: -amount,
          referenceId,
          description,
        },
      });

      return client.wpggWallet.findUniqueOrThrow({
        where: { id: wallet.id },
      });
    };

    if (tx) {
      return run(tx);
    }
    return this.prisma.$transaction(run);
  }

  async credit(
    userId: string,
    amount: number,
    type: WpggTransactionType,
    referenceId: string,
    description: string,
    tx?: TxClient,
  ): Promise<WpggWallet> {
    const run = async (client: TxClient) => {
      const wallet = await this.ensureWallet(userId, client);
      await client.wpggTransaction.create({
        data: {
          walletId: wallet.id,
          type,
          amount,
          referenceId,
          description,
        },
      });
      return client.wpggWallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      });
    };

    if (tx) {
      return run(tx);
    }
    return this.prisma.$transaction(run);
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
    from.setUTCHours(0, 0, 0, 0);
    from.setUTCDate(from.getUTCDate() - days);
    return this.prisma.wpggMarketPrice.findMany({
      where: { date: { gte: from } },
      orderBy: { date: 'asc' },
    });
  }
}
