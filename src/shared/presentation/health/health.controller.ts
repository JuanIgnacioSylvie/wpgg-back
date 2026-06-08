import { Controller, Get } from '@nestjs/common';
import { getAppMode } from '../../../config/app-mode';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      mode: getAppMode(),
    };
  }
}
