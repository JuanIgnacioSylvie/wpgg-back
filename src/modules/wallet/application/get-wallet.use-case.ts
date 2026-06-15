import { Injectable } from '@nestjs/common';
import {
  WPGG_CANCEL_COST,
  WPGG_MIN_WITHDRAW,
  WPGG_REROLL_COST,
} from '../domain/wpgg-economy.constants';
import { PrismaWalletRepository } from '../infrastructure/persistence/prisma-wallet.repository';
import { WpggMarketPriceService } from './wpgg-market-price.service';

@Injectable()
export class GetWalletUseCase {
  constructor(
    private readonly walletRepo: PrismaWalletRepository,
    private readonly marketPrices: WpggMarketPriceService,
  ) {}

  async execute(userId: string) {
    const wallet = await this.walletRepo.ensureWallet(userId);
    const latestPriceUsd = await this.marketPrices.getLatestPriceUsd();

    return {
      balance: wallet.balance,
      minWithdrawWpgg: WPGG_MIN_WITHDRAW,
      rerollCostWpgg: WPGG_REROLL_COST,
      cancelCostWpgg: WPGG_CANCEL_COST,
      latestPriceUsd,
    };
  }
}
