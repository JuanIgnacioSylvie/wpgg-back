import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { isRelaxFromConfig } from '../../../../config/relax-env';
import { ITurnstileProvider } from '../../domain/providers/turnstile.provider.interface';

type SiteverifyResponse = {
  success?: boolean;
  'error-codes'?: string[];
};

@Injectable()
export class CloudflareTurnstileProvider implements ITurnstileProvider {
  private readonly logger = new Logger(CloudflareTurnstileProvider.name);

  constructor(private readonly config: ConfigService) {}

  async verifyToken(token: string, remoteIp?: string): Promise<boolean> {
    const secret = this.config.get<string>('TURNSTILE_SECRET_KEY')?.trim();
    if (!secret || isRelaxFromConfig(this.config)) {
      return true;
    }

    const response = token?.trim();
    if (!response) {
      return false;
    }

    try {
      const params = new URLSearchParams({
        secret,
        response,
      });
      if (remoteIp?.trim()) {
        params.set('remoteip', remoteIp.trim());
      }

      const { data } = await axios.post<SiteverifyResponse>(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        params.toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 10_000,
        },
      );

      if (data.success === true) {
        return true;
      }

      this.logger.warn(
        `Turnstile rejected token: ${(data['error-codes'] ?? []).join(', ') || 'unknown'}`,
      );
      return false;
    } catch (err) {
      this.logger.error(
        'Turnstile siteverify request failed',
        err instanceof Error ? err.stack : String(err),
      );
      return false;
    }
  }
}
