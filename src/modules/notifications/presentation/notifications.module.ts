import { Module } from '@nestjs/common';
import { AuthModule } from '@modules/auth/presentation/auth.module';
import { NotificationsCoreModule } from './notifications-core.module';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [AuthModule, NotificationsCoreModule],
  controllers: [NotificationsController],
})
export class NotificationsModule {}
