import { Injectable } from '@nestjs/common';
import { PrismaStoreRepository } from '../infrastructure/persistence/prisma-store.repository';
import { mapStoreOrder } from './store-order.mapper';

@Injectable()
export class ListStoreOrdersUseCase {
  constructor(private readonly repo: PrismaStoreRepository) {}

  async execute(userId: string) {
    const orders = await this.repo.listOrders(userId);
    return { orders: orders.map(mapStoreOrder) };
  }
}
