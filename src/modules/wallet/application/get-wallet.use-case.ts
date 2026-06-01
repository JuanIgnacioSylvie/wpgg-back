import { Injectable } from '@nestjs/common';
import { PrismaWalletRepository } from '../infrastructure/persistence/prisma-wallet.repository';

const MIN_WITHDRAW_WPGG = 1000;

@Injectable()
export class GetWalletUseCase {
  constructor(private readonly walletRepo: PrismaWalletRepository) {}

  async execute(userId: string) {
    const wallet = await this.walletRepo.ensureWallet(userId);
    const prices = await this.walletRepo.marketChart(1);
    const latestPrice =
      prices.length > 0 ? Number(prices[prices.length - 1].priceUsd) : 0.17;

    return {
      balance: wallet.balance,
      minWithdrawWpgg: MIN_WITHDRAW_WPGG,
      latestPriceUsd: latestPrice,
    };
  }
}
