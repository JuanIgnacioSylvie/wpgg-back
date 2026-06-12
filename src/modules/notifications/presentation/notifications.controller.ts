import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@shared/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import {
  ListNotificationInboxUseCase,
  MarkAllNotificationsReadUseCase,
  MarkNotificationReadUseCase,
  RegisterPushDeviceUseCase,
  SendTestPushUseCase,
  UnregisterPushDeviceUseCase,
} from '../application/notifications.use-cases';
import { InboxQueryDto } from './dto/inbox-query.dto';
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
    private readonly listInbox: ListNotificationInboxUseCase,
    private readonly markRead: MarkNotificationReadUseCase,
    private readonly markAllRead: MarkAllNotificationsReadUseCase,
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

  @Get('inbox')
  inbox(@CurrentUser() userId: string, @Query() query: InboxQueryDto) {
    return this.listInbox.execute(userId, query.limit, query.cursor);
  }

  @Patch('inbox/:id/read')
  readOne(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.markRead.execute(userId, id);
  }

  @Post('inbox/read-all')
  readAll(@CurrentUser() userId: string) {
    return this.markAllRead.execute(userId);
  }
}
