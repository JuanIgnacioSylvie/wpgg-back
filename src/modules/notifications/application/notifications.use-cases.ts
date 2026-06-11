import { Injectable } from '@nestjs/common';
import { PushNotificationService } from '../application/push-notification.service';

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
      title: 'WPGG',
      body: 'Test notification — push is working.',
      route: '/home',
    });
  }
}
