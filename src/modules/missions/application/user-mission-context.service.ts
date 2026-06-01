import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  calendarDateToMissionDay,
  todayMissionCalendarDate,
} from '../domain/mission-timezone.util';
import { PrismaMissionsRepository } from '../infrastructure/persistence/prisma-missions.repository';

@Injectable()
export class UserMissionContextService {
  constructor(private readonly repo: PrismaMissionsRepository) {}

  async requireRiotAccount(userId: string) {
    const account = await this.repo.findRiotAccount(userId);
    if (!account) {
      throw new ForbiddenException('Link a Riot account first');
    }
    return account;
  }

  todayCalendarDate(): Date {
    return todayMissionCalendarDate();
  }

  parseCalendarDateParam(dateStr: string): Date {
    return calendarDateToMissionDay(dateStr);
  }
}
