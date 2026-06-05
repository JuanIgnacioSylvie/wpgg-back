import { Module } from '@nestjs/common';
import { AuthModule } from '@modules/auth/presentation/auth.module';
import { BlockchainModule } from '@modules/blockchain/presentation/blockchain.module';
import { WalletModule } from '@modules/wallet/presentation/wallet.module';
import { SharedModule } from '@shared/shared.module';
import { WithdrawalService } from '../application/withdrawal.service';
import { PrismaWithdrawalRepository } from '../infrastructure/persistence/prisma-withdrawal.repository';
import { WithdrawalController } from './withdrawal.controller';

@Module({
  imports: [SharedModule, AuthModule, WalletModule, BlockchainModule],
  controllers: [WithdrawalController],
  providers: [WithdrawalService, PrismaWithdrawalRepository],
})
export class WithdrawalModule {}
