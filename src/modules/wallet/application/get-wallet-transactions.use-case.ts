import { Injectable } from '@nestjs/common';
import { PrismaWalletRepository } from '../infrastructure/persistence/prisma-wallet.repository';

@Injectable()
export class GetWalletTransactionsUseCase {
  constructor(private readonly walletRepo: PrismaWalletRepository) {}

  async execute(
    userId: string,
    filter: 'all' | 'income' | 'expense' = 'all',
  ) {
    await this.walletRepo.ensureWallet(userId);
    const rows = await this.walletRepo.listTransactions(userId, filter);
    return rows.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      description: t.description,
      createdAt: t.createdAt.toISOString(),
    }));
  }
}
