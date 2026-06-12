import { Module } from '@nestjs/common';
import { SharedModule } from '@shared/shared.module';
import { PushNotificationService } from '../application/push-notification.service';
import {
  ListNotificationInboxUseCase,
  MarkAllNotificationsReadUseCase,
  MarkNotificationReadUseCase,
  RegisterPushDeviceUseCase,
  SendTestPushUseCase,
  UnregisterPushDeviceUseCase,
} from '../application/notifications.use-cases';
import { PrismaNotificationInboxRepository } from '../infrastructure/persistence/prisma-notification-inbox.repository';
import { PrismaPushDeviceRepository } from '../infrastructure/persistence/prisma-push-device.repository';

@Module({
  imports: [SharedModule],
  providers: [
    PrismaPushDeviceRepository,
    PrismaNotificationInboxRepository,
    PushNotificationService,
    RegisterPushDeviceUseCase,
    UnregisterPushDeviceUseCase,
    SendTestPushUseCase,
    ListNotificationInboxUseCase,
    MarkNotificationReadUseCase,
    MarkAllNotificationsReadUseCase,
  ],
  exports: [
    PushNotificationService,
    RegisterPushDeviceUseCase,
    UnregisterPushDeviceUseCase,
    SendTestPushUseCase,
    ListNotificationInboxUseCase,
    MarkNotificationReadUseCase,
    MarkAllNotificationsReadUseCase,
  ],
})
export class NotificationsCoreModule {}
