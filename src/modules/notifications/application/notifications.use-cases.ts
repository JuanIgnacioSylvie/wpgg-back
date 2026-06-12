import { Injectable, NotFoundException } from '@nestjs/common';
import { PushNotificationService } from '../application/push-notification.service';
import { PrismaNotificationInboxRepository } from '../infrastructure/persistence/prisma-notification-inbox.repository';

@Injectable()
export class RegisterPushDeviceUseCase {
  constructor(private readonly push: PushNotificationService) {}

  execute(userId: string, token: string, platform: string) {
    return this.push.registerDevice(userId, token, platform);
  }
}

@Injectable()
export class UnregisterPushDeviceUseCase {
  constructor(private readonly push: PushNotificationService) {}

  execute(userId: string, token: string) {
    return this.push.unregisterDevice(userId, token);
  }
}

@Injectable()
export class SendTestPushUseCase {
  constructor(private readonly push: PushNotificationService) {}

  execute(userId: string) {
    return this.push.sendToUser(userId, {
      type: 'TEST',
      title: 'WPGG',
      body: 'Test notification — push is working.',
      route: '/home',
    });
  }
}

@Injectable()
export class ListNotificationInboxUseCase {
  constructor(private readonly inbox: PrismaNotificationInboxRepository) {}

  async execute(userId: string, limit = 20, cursor?: string) {
    const parsedCursor = cursor ? new Date(cursor) : undefined;
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const items = await this.inbox.listForUser(
      userId,
      safeLimit,
      parsedCursor,
    );
    const unreadCount = await this.inbox.countUnread(userId);
    const nextCursor =
      items.length === safeLimit
        ? items[items.length - 1]?.createdAt.toISOString()
        : null;

    return {
      items: items.map((row) => ({
        id: row.id,
        type: row.type,
        title: row.title,
        body: row.body,
        route: row.route,
        readAt: row.readAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
      })),
      nextCursor,
      unreadCount,
    };
  }
}

@Injectable()
export class MarkNotificationReadUseCase {
  constructor(private readonly inbox: PrismaNotificationInboxRepository) {}

  async execute(userId: string, id: string) {
    const updated = await this.inbox.markRead(userId, id);
    if (updated === 0) {
      throw new NotFoundException('Notification not found');
    }
    return { ok: true };
  }
}

@Injectable()
export class MarkAllNotificationsReadUseCase {
  constructor(private readonly inbox: PrismaNotificationInboxRepository) {}

  async execute(userId: string) {
    const count = await this.inbox.markAllRead(userId);
    return { ok: true, count };
  }
}

@Injectable()
export class DeleteNotificationUseCase {
  constructor(private readonly inbox: PrismaNotificationInboxRepository) {}

  async execute(userId: string, id: string) {
    const deleted = await this.inbox.deleteOne(userId, id);
    if (deleted === 0) {
      throw new NotFoundException('Notification not found');
    }
    return { ok: true };
  }
}

@Injectable()
export class DeleteAllNotificationsUseCase {
  constructor(private readonly inbox: PrismaNotificationInboxRepository) {}

  async execute(userId: string) {
    const count = await this.inbox.deleteAll(userId);
    return { ok: true, count };
  }
}
