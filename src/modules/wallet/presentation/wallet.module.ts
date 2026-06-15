import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { AuthModule } from '@modules/auth/presentation/auth.module';
import { SharedModule } from '@shared/shared.module';
import { GetMarketChartUseCase } from '../application/get-market-chart.use-case';
import { GetWalletTransactionsUseCase } from '../application/get-wallet-transactions.use-case';
import { GetWalletUseCase } from '../application/get-wallet.use-case';
import { WpggMarketPriceService } from '../application/wpgg-market-price.service';
import { GeckoTerminalClient } from '../infrastructure/providers/gecko-terminal.client';
import { PrismaWalletRepository } from '../infrastructure/persistence/prisma-wallet.repository';
import { WalletController } from './wallet.controller';

@Module({
  imports: [
    SharedModule,
    AuthModule,
    CacheModule.register({
      ttl: 60_000,
    }),
  ],
  controllers: [WalletController],
  providers: [
    PrismaWalletRepository,
    GeckoTerminalClient,
    WpggMarketPriceService,
    GetWalletUseCase,
    GetWalletTransactionsUseCase,
    GetMarketChartUseCase,
  ],
  exports: [PrismaWalletRepository, WpggMarketPriceService],
})
export class WalletModule {}
