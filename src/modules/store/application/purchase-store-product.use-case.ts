import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  EMAIL_PROVIDER,
  IEmailProvider,
} from '@modules/auth/domain/providers/email.provider.interface';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '@modules/auth/domain/repositories/user.repository.interface';
import { InsufficientBalanceError } from '@modules/wallet/domain/errors/insufficient-balance.error';
import { PrismaWalletRepository } from '@modules/wallet/infrastructure/persistence/prisma-wallet.repository';
import { OutOfStockError } from '../domain/errors/out-of-stock.error';
import { PrismaStoreRepository } from '../infrastructure/persistence/prisma-store.repository';
import { mapStoreOrder } from './store-order.mapper';

@Injectable()
export class PurchaseStoreProductUseCase {
  private readonly logger = new Logger(PurchaseStoreProductUseCase.name);

  constructor(
    private readonly repo: PrismaStoreRepository,
    private readonly walletRepo: PrismaWalletRepository,
    @Inject(USER_REPOSITORY)
    private readonly users: IUserRepository,
    @Inject(EMAIL_PROVIDER)
    private readonly email: IEmailProvider,
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

      const mapped = mapStoreOrder(order);
      const wallet = await this.walletRepo.getWallet(userId);

      await this.sendPurchaseEmail(userId, mapped);

      return {
        order: mapped,
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

  private async sendPurchaseEmail(
    userId: string,
    order: ReturnType<typeof mapStoreOrder>,
  ): Promise<void> {
    try {
      const user = await this.users.findById(userId);
      if (!user?.email) {
        return;
      }

      await this.email.sendStorePurchaseEmail({
        to: user.email,
        productName: order.productName,
        rpAmount: order.rpAmount,
        riotKey: order.riotKey,
      });
    } catch (error) {
      this.logger.warn(
        `Store purchase email failed for user ${userId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
