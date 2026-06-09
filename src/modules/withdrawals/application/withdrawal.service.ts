import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { WpggTransactionType } from '@prisma/client';
import { isAddress } from 'ethers';
import { BlockchainService } from '@modules/blockchain/infrastructure/blockchain.service';
import { InsufficientBalanceError } from '@modules/wallet/domain/errors/insufficient-balance.error';
import { WPGG_MIN_WITHDRAW } from '@modules/wallet/domain/wpgg-economy.constants';
import { PrismaWalletRepository } from '@modules/wallet/infrastructure/persistence/prisma-wallet.repository';
import { PrismaWithdrawalRepository } from '../infrastructure/persistence/prisma-withdrawal.repository';

@Injectable()
export class WithdrawalService {
  constructor(
    private readonly walletRepo: PrismaWalletRepository,
    private readonly withdrawalRepo: PrismaWithdrawalRepository,
    private readonly blockchainService: BlockchainService,
  ) {}

  async requestWithdrawal(
    userId: string,
    walletAddress: string,
    amountWpgg: number,
  ) {
    if (amountWpgg < WPGG_MIN_WITHDRAW) {
      throw new BadRequestException(
        `Minimum withdrawal amount is ${WPGG_MIN_WITHDRAW} WPGG`,
      );
    }

    if (!isAddress(walletAddress)) {
      throw new BadRequestException('Invalid wallet address');
    }

    const wallet = await this.walletRepo.ensureWallet(userId);
    if (wallet.balance < amountWpgg) {
      throw new BadRequestException('Insufficient WPGG balance');
    }

    const withdrawal = await this.withdrawalRepo.createPending(
      userId,
      walletAddress,
      amountWpgg,
    );

    try {
      await this.walletRepo.debit(
        userId,
        amountWpgg,
        WpggTransactionType.WITHDRAW_RESERVED,
        `withdrawal:${withdrawal.id}`,
        `Withdrawal to ${walletAddress}`,
      );
    } catch (error) {
      await this.withdrawalRepo.markFailed(withdrawal.id);
      if (error instanceof InsufficientBalanceError) {
        throw new BadRequestException('Insufficient WPGG balance');
      }
      throw error;
    }

    try {
      const txHash = await this.blockchainService.withdrawReward(
        walletAddress,
        amountWpgg,
      );

      const completed = await this.withdrawalRepo.markCompleted(
        withdrawal.id,
        txHash,
      );

      return {
        id: completed.id,
        walletAddress: completed.walletAddress,
        amountWpgg: completed.amountWpgg,
        txHash: completed.txHash,
        status: completed.status,
        createdAt: completed.createdAt,
      };
    } catch (error) {
      await this.walletRepo.credit(
        userId,
        amountWpgg,
        WpggTransactionType.ADJUSTMENT,
        `withdrawal-rollback:${withdrawal.id}`,
        `Withdrawal rollback: ${withdrawal.id}`,
      );
      await this.withdrawalRepo.markFailed(withdrawal.id);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Withdrawal failed on-chain; balance has been restored',
      );
    }
  }
}
