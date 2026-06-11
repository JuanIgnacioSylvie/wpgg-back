import { Module } from '@nestjs/common';
import { SharedModule } from '@shared/shared.module';
import { PushNotificationService } from '../application/push-notification.service';
import {
  RegisterPushDeviceUseCase,
  SendTestPushUseCase,
  UnregisterPushDeviceUseCase,
} from '../application/notifications.use-cases';
import { PrismaPushDeviceRepository } from '../infrastructure/persistence/prisma-push-device.repository';

@Module({
  imports: [SharedModule],
  providers: [
    PrismaPushDeviceRepository,
    PushNotificationService,
    RegisterPushDeviceUseCase,
    UnregisterPushDeviceUseCase,
    SendTestPushUseCase,
  ],
  exports: [
    PushNotificationService,
    RegisterPushDeviceUseCase,
    UnregisterPushDeviceUseCase,
    SendTestPushUseCase,
  ],
})
export class NotificationsCoreModule {}
