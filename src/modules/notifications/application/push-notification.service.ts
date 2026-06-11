import {
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { PrismaPushDeviceRepository } from '../infrastructure/persistence/prisma-push-device.repository';

export type PushPayload = {
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
  ) {}

  onModuleInit(): void {
    const projectId = this.config.get<string>('FIREBASE_PROJECT_ID')?.trim();
    const clientEmail = this.config
      .get<string>('FIREBASE_CLIENT_EMAIL')
      ?.trim();
    const privateKey = this.config
      .get<string>('FIREBASE_PRIVATE_KEY')
      ?.replace(/\\n/g, '\n')
      .trim();

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn(
        'Push notifications disabled: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY not configured',
      );
      return;
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }

    this.messaging = admin.messaging();
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
      return;
    }

    const tokens = await this.devices.findEnabledTokensForUser(userId);
    if (tokens.length === 0) {
      return;
    }

    const webLink = payload.route
      ? `https://wpgg.lol${payload.route.startsWith('/') ? payload.route : `/${payload.route}`}`
      : 'https://wpgg.lol/home';

    const response = await this.messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.route ? { route: payload.route } : {},
      webpush: {
        fcmOptions: { link: webLink },
        notification: {
          icon: 'https://wpgg.lol/icons/Icon-192.png',
        },
      },
    });

    const invalidTokens: string[] = [];
    response.responses.forEach((result, index) => {
      if (result.success) {
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

    if (invalidTokens.length > 0) {
      await this.devices.deleteByTokens(invalidTokens);
    }
  }

  async sendMissionCompleted(
    userId: string,
    input: { titleEn: string; rewardWpgg: number },
  ): Promise<void> {
    await this.sendToUser(userId, {
      title: 'Mission completed!',
      body: `${input.titleEn} — +${input.rewardWpgg} WPGG`,
      route: '/home',
    });
  }
}
