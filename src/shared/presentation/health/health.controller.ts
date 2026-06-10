import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getAppMode } from '../../../config/app-mode';

@Controller('health')
export class HealthController {
  constructor(private readonly config: ConfigService) {}

  @Get()
  check() {
    return {
      status: 'ok',
      mode: getAppMode(),
    };
  }

  /** Public client bootstrap (no auth). */
  @Get('public-config')
  publicConfig() {
    const secret = this.config.get<string>('TURNSTILE_SECRET_KEY')?.trim();
    const siteKey = this.config.get<string>('TURNSTILE_SITE_KEY')?.trim();
    return {
      turnstileSiteKey: secret && siteKey ? siteKey : '',
    };
  }
}
