import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  calendarDateInTimezone,
  defaultTimezoneForRegion,
} from '../domain/mission-timezone.util';
import { PrismaMissionsRepository } from '../infrastructure/persistence/prisma-missions.repository';

@Injectable()
export class UserMissionContextService {
  constructor(private readonly repo: PrismaMissionsRepository) {}

  async resolveTimezone(userId: string): Promise<string> {
    const user = await this.repo.findUserTimezone(userId);
    if (user?.timezone) {
      return user.timezone;
    }
    const riot = await this.repo.findRiotAccount(userId);
    if (riot) {
      return defaultTimezoneForRegion(riot.region);
    }
    return 'UTC';
  }

  async requireRiotAccount(userId: string) {
    const account = await this.repo.findRiotAccount(userId);
    if (!account) {
      throw new ForbiddenException('Link a Riot account first');
    }
    return account;
  }

  todayCalendarDate(timezone: string): Date {
    const str = calendarDateInTimezone(new Date(), timezone);
    return new Date(`${str}T12:00:00.000Z`);
  }

  parseCalendarDateParam(dateStr: string): Date {
    return new Date(`${dateStr}T12:00:00.000Z`);
  }
}
