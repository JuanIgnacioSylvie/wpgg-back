import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';

export type InboxNotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  route: string | null;
  readAt: Date | null;
  createdAt: Date;
};

export type CreateInboxNotificationInput = {
  type: string;
  title: string;
  body: string;
  route?: string;
};

@Injectable()
export class PrismaNotificationInboxRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, input: CreateInboxNotificationInput) {
    return this.prisma.userNotification.create({
      data: {
        userId,
        type: input.type,
        title: input.title,
        body: input.body,
        route: input.route ?? null,
      },
    });
  }

  async listForUser(
    userId: string,
    limit: number,
    cursor?: Date,
  ): Promise<InboxNotificationRow[]> {
    return this.prisma.userNotification.findMany({
      where: {
        userId,
        ...(cursor ? { createdAt: { lt: cursor } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        route: true,
        readAt: true,
        createdAt: true,
      },
    });
  }

  countUnread(userId: string): Promise<number> {
    return this.prisma.userNotification.count({
      where: { userId, readAt: null },
    });
  }

  markRead(userId: string, id: string): Promise<number> {
    return this.prisma.userNotification
      .updateMany({
        where: { id, userId, readAt: null },
        data: { readAt: new Date() },
      })
      .then((result) => result.count);
  }

  markAllRead(userId: string): Promise<number> {
    return this.prisma.userNotification
      .updateMany({
        where: { userId, readAt: null },
        data: { readAt: new Date() },
      })
      .then((result) => result.count);
  }

  deleteOne(userId: string, id: string): Promise<number> {
    return this.prisma.userNotification
      .deleteMany({
        where: { id, userId },
      })
      .then((result) => result.count);
  }

  deleteAll(userId: string): Promise<number> {
    return this.prisma.userNotification
      .deleteMany({
        where: { userId },
      })
      .then((result) => result.count);
  }
}
