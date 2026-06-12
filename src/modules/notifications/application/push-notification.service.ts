import {
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { PrismaPushDeviceRepository } from '../infrastructure/persistence/prisma-push-device.repository';
import { PrismaNotificationInboxRepository } from '../infrastructure/persistence/prisma-notification-inbox.repository';
import { parseFirebaseServiceAccount } from '../infrastructure/firebase-credential.util';

export type PushPayload = {
  type?: string;
  title: string;
  body: string;
  route?: string;
};

@Injectable()
export class PushNotificationService implements OnModuleInit {
  private readonly logger = new Logger(PushNotificationService.name);
  private messaging: admin.messaging.Messaging | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly devices: PrismaPushDeviceRepository,
    private readonly inbox: PrismaNotificationInboxRepository,
  ) {}

  onModuleInit(): void {
    const serviceAccount = parseFirebaseServiceAccount(this.config);
    if (!serviceAccount) {
      this.logger.warn(
        'Push notifications disabled: set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY',
      );
      return;
    }

    try {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      }
      this.messaging = admin.messaging();
      this.logger.log(
        `Firebase push initialized for project ${serviceAccount.projectId}`,
      );
    } catch (error) {
      this.logger.error(
        `Firebase push init failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async registerDevice(
    userId: string,
    token: string,
    platform: string,
  ): Promise<void> {
    await this.devices.upsertDevice(userId, token, platform);
  }

  async unregisterDevice(userId: string, token: string): Promise<void> {
    await this.devices.deleteByUserAndToken(userId, token);
  }

  async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    if (!this.messaging) {
      throw new Error('Push notifications are not configured on the server');
    }

    await this.inbox.create(userId, {
      type: payload.type ?? 'GENERAL',
      title: payload.title,
      body: payload.body,
      route: payload.route,
    });

    const tokens = await this.devices.findEnabledTokensForUser(userId);
    if (tokens.length === 0) {
      this.logger.log(
        `Inbox notification saved for user ${userId}; no push devices registered`,
      );
      return;
    }

    const route = payload.route;
    const webLink = route
      ? `https://wpgg.lol${route.startsWith('/') ? route : `/${route}`}`
      : 'https://wpgg.lol/home';

    try {
      const response = await this.messaging.sendEachForMulticast({
        tokens,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: route ? { route } : {},
        webpush: {
          fcmOptions: { link: webLink },
          notification: {
            icon: 'https://wpgg.lol/icons/Icon-192.png',
          },
        },
      });

      const invalidTokens: string[] = [];
      let successCount = 0;
      response.responses.forEach((result, index) => {
        if (result.success) {
          successCount += 1;
          return;
        }
        const code = result.error?.code;
        if (
          code === 'messaging/invalid-registration-token' ||
          code === 'messaging/registration-token-not-registered'
        ) {
          invalidTokens.push(tokens[index]!);
        } else {
          this.logger.warn(
            `FCM send failed for user ${userId}: ${result.error?.message ?? 'unknown'}`,
          );
        }
      });

      if (successCount === 0) {
        const firstError = response.responses.find((r) => !r.success)?.error
          ?.message;
        throw new Error(
          firstError
            ? `FCM rejected all tokens: ${firstError}`
            : 'FCM rejected all tokens',
        );
      }

      if (invalidTokens.length > 0) {
        await this.devices.deleteByTokens(invalidTokens);
      }

      this.logger.log(
        `FCM delivered ${successCount}/${tokens.length} token(s) for user ${userId}`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.error(`FCM send error for user ${userId}: ${message}`);
      throw error;
    }
  }

  async sendMissionCompleted(
    userId: string,
    input: { titleEn: string; rewardWpgg: number },
  ): Promise<void> {
    await this.sendToUser(userId, {
      type: 'MISSION_COMPLETED',
      title: 'Mission completed!',
      body: `${input.titleEn} — +${input.rewardWpgg} WPGG`,
      route: '/home',
    });
  }
}
