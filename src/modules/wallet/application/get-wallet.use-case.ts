import { Injectable } from '@nestjs/common';
import {
  WPGG_CANCEL_COST,
  WPGG_MIN_WITHDRAW,
  WPGG_REROLL_COST,
} from '../domain/wpgg-economy.constants';
import { PrismaWalletRepository } from '../infrastructure/persistence/prisma-wallet.repository';

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
      minWithdrawWpgg: WPGG_MIN_WITHDRAW,
      rerollCostWpgg: WPGG_REROLL_COST,
      cancelCostWpgg: WPGG_CANCEL_COST,
      latestPriceUsd: latestPrice,
    };
  }
}
