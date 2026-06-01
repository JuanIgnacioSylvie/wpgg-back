import { Module } from '@nestjs/common';
import { AuthModule } from '@modules/auth/presentation/auth.module';
import { SharedModule } from '@shared/shared.module';
import { GetMarketChartUseCase } from '../application/get-market-chart.use-case';
import { GetWalletTransactionsUseCase } from '../application/get-wallet-transactions.use-case';
import { GetWalletUseCase } from '../application/get-wallet.use-case';
import { PrismaWalletRepository } from '../infrastructure/persistence/prisma-wallet.repository';
import { WalletController } from './wallet.controller';

@Module({
  imports: [SharedModule, AuthModule],
  controllers: [WalletController],
  providers: [
    PrismaWalletRepository,
    GetWalletUseCase,
    GetWalletTransactionsUseCase,
    GetMarketChartUseCase,
  ],
  exports: [PrismaWalletRepository],
})
export class WalletModule {}
