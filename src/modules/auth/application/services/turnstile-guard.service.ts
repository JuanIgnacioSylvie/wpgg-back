import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isRelaxFromConfig } from '../../../../config/relax-env';
import {
  ITurnstileProvider,
  TURNSTILE_PROVIDER,
} from '../../domain/providers/turnstile.provider.interface';
import { Inject } from '@nestjs/common';

@Injectable()
export class TurnstileGuardService {
  constructor(
    private readonly config: ConfigService,
    @Inject(TURNSTILE_PROVIDER)
    private readonly turnstile: ITurnstileProvider,
  ) {}

  /** Requires a valid Turnstile token for web clients when configured. */
  async assertForWebClient(
    turnstileToken: string | undefined,
    clientPlatform: string | undefined,
    remoteIp?: string,
  ): Promise<void> {
    const secret = this.config.get<string>('TURNSTILE_SECRET_KEY')?.trim();
    if (!secret || isRelaxFromConfig(this.config)) {
      return;
    }

    const platform = clientPlatform?.trim().toLowerCase();
    if (platform !== 'web') {
      return;
    }

    const valid = await this.turnstile.verifyToken(
      turnstileToken ?? '',
      remoteIp,
    );
    if (!valid) {
      throw new BadRequestException('Captcha verification failed');
    }
  }
}
