import { Body, Controller, Delete, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@shared/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import {
  RegisterPushDeviceUseCase,
  SendTestPushUseCase,
  UnregisterPushDeviceUseCase,
} from '../application/notifications.use-cases';
import {
  RegisterPushDeviceDto,
  UnregisterPushDeviceDto,
} from './dto/push-device.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly registerDevice: RegisterPushDeviceUseCase,
    private readonly unregisterDevice: UnregisterPushDeviceUseCase,
    private readonly sendTest: SendTestPushUseCase,
  ) {}

  @Post('devices')
  register(
    @CurrentUser() userId: string,
    @Body() body: RegisterPushDeviceDto,
  ) {
    return this.registerDevice
      .execute(userId, body.token, body.platform)
      .then(() => ({ ok: true }));
  }

  @Delete('devices')
  unregister(
    @CurrentUser() userId: string,
    @Body() body: UnregisterPushDeviceDto,
  ) {
    return this.unregisterDevice
      .execute(userId, body.token)
      .then(() => ({ ok: true }));
  }

  @Post('test')
  test(@CurrentUser() userId: string) {
    return this.sendTest.execute(userId).then(() => ({ ok: true }));
  }
}
