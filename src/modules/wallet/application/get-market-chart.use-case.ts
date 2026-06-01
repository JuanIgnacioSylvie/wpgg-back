import { Injectable } from '@nestjs/common';
import { PrismaWalletRepository } from '../infrastructure/persistence/prisma-wallet.repository';

@Injectable()
export class GetMarketChartUseCase {
  constructor(private readonly walletRepo: PrismaWalletRepository) {}

  async execute(days = 7) {
    const clamped = Math.min(Math.max(days, 1), 30);
    const rows = await this.walletRepo.marketChart(clamped);
    return {
      points: rows.map((r) => ({
        date: r.date.toISOString().slice(0, 10),
        priceUsd: Number(r.priceUsd),
      })),
    };
  }
}
