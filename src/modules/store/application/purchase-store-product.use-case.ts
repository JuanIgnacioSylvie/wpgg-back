import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InsufficientBalanceError } from '@modules/wallet/domain/errors/insufficient-balance.error';
import { PrismaWalletRepository } from '@modules/wallet/infrastructure/persistence/prisma-wallet.repository';
import { OutOfStockError } from '../domain/errors/out-of-stock.error';
import { PrismaStoreRepository } from '../infrastructure/persistence/prisma-store.repository';
import { mapStoreOrder } from './store-order.mapper';

@Injectable()
export class PurchaseStoreProductUseCase {
  constructor(
    private readonly repo: PrismaStoreRepository,
    private readonly walletRepo: PrismaWalletRepository,
  ) {}

  async execute(
    userId: string,
    productSlug: string,
    idempotencyKey?: string,
  ) {
    const orderId = idempotencyKey ?? randomUUID();

    try {
      const order = await this.repo.purchaseProduct(
        userId,
        productSlug,
        orderId,
        idempotencyKey,
      );

      if (!order) {
        throw new NotFoundException('Product not found');
      }

      const wallet = await this.walletRepo.getWallet(userId);
      return {
        order: mapStoreOrder(order),
        balance: wallet?.balance ?? 0,
      };
    } catch (error) {
      if (error instanceof InsufficientBalanceError) {
        throw new BadRequestException('Insufficient WPGG balance');
      }
      if (error instanceof OutOfStockError) {
        throw new BadRequestException('Product out of stock');
      }
      throw error;
    }
  }
}
