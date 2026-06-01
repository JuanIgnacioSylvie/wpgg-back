import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@shared/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { GetMarketChartUseCase } from '../application/get-market-chart.use-case';
import { GetWalletTransactionsUseCase } from '../application/get-wallet-transactions.use-case';
import { GetWalletUseCase } from '../application/get-wallet.use-case';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(
    private readonly getWallet: GetWalletUseCase,
    private readonly getTransactions: GetWalletTransactionsUseCase,
    private readonly getChart: GetMarketChartUseCase,
  ) {}

  @Get()
  wallet(@CurrentUser() userId: string) {
    return this.getWallet.execute(userId);
  }

  @Get('transactions')
  transactions(
    @CurrentUser() userId: string,
    @Query('filter') filter?: 'all' | 'income' | 'expense',
  ) {
    const f =
      filter === 'income' || filter === 'expense' ? filter : 'all';
    return this.getTransactions.execute(userId, f);
  }

  @Get('market-chart')
  marketChart(@Query('days') days?: string) {
    const n = days ? parseInt(days, 10) : 7;
    return this.getChart.execute(Number.isNaN(n) ? 7 : n);
  }
}
