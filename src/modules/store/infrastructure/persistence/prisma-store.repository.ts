import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InsufficientBalanceError } from '@modules/wallet/domain/errors/insufficient-balance.error';
import { PrismaWalletRepository } from '@modules/wallet/infrastructure/persistence/prisma-wallet.repository';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { OutOfStockError } from '../../domain/errors/out-of-stock.error';

const orderInclude = {
  product: true,
  key: true,
} satisfies Prisma.StoreOrderInclude;

@Injectable()
export class PrismaStoreRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletRepo: PrismaWalletRepository,
  ) {}

  listActiveProducts() {
    return this.prisma.storeProduct.findMany({
      where: { active: true },
      orderBy: { priceWpgg: 'asc' },
    });
  }

  listOrders(userId: string, limit = 50) {
    return this.prisma.storeOrder.findMany({
      where: { userId },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  findOrderByIdempotency(userId: string, idempotencyKey: string) {
    return this.prisma.storeOrder.findUnique({
      where: {
        userId_idempotencyKey: {
          userId,
          idempotencyKey,
        },
      },
      include: orderInclude,
    });
  }

  findOrderById(orderId: string) {
    return this.prisma.storeOrder.findUnique({
      where: { id: orderId },
      include: orderInclude,
    });
  }

  async purchaseProduct(
    userId: string,
    productSlug: string,
    orderId: string,
    idempotencyKey?: string,
  ) {
    const existingById = await this.findOrderById(orderId);
    if (existingById) {
      if (existingById.userId !== userId) {
        throw new Error('Order id conflict');
      }
      return existingById;
    }

    if (idempotencyKey) {
      const existing = await this.findOrderByIdempotency(userId, idempotencyKey);
      if (existing) {
        return existing;
      }
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const product = await tx.storeProduct.findFirst({
          where: { slug: productSlug, active: true },
        });
        if (!product) {
          return null;
        }

        await this.walletRepo.debit(
          userId,
          product.priceWpgg,
          'STORE_PURCHASE',
          `purchase:${orderId}`,
          `Store purchase: ${product.nameEn}`,
          tx,
        );

        const availableKey = await tx.storeProductKey.findFirst({
          where: { productId: product.id, status: 'AVAILABLE' },
          orderBy: { createdAt: 'asc' },
        });
        if (!availableKey) {
          throw new OutOfStockError();
        }

        const claimed = await tx.storeProductKey.updateMany({
          where: { id: availableKey.id, status: 'AVAILABLE' },
          data: {
            status: 'ASSIGNED',
            assignedAt: new Date(),
          },
        });
        if (claimed.count !== 1) {
          throw new OutOfStockError();
        }

        return tx.storeOrder.create({
          data: {
            id: orderId,
            userId,
            productId: product.id,
            priceWpgg: product.priceWpgg,
            keyId: availableKey.id,
            idempotencyKey: idempotencyKey ?? null,
          },
          include: orderInclude,
        });
      });
    } catch (error) {
      if (error instanceof InsufficientBalanceError) {
        throw error;
      }
      if (error instanceof OutOfStockError) {
        throw error;
      }
      throw error;
    }
  }
}
