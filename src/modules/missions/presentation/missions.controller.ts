import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@shared/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { AcceptMissionOfferUseCase } from '../application/accept-mission-offer.use-case';
import { GetMissionsByDayUseCase } from '../application/get-missions-by-day.use-case';
import { GetMissionsHomeUseCase } from '../application/get-missions-home.use-case';
import { GetPickTodayUseCase } from '../application/get-pick-today.use-case';
import { RerollMissionOfferUseCase } from '../application/reroll-mission-offer.use-case';
import { SyncUserMatchesUseCase } from '../application/sync-user-matches.use-case';

@Controller('missions')
@UseGuards(JwtAuthGuard)
export class MissionsController {
  constructor(
    private readonly getHome: GetMissionsHomeUseCase,
    private readonly getByDay: GetMissionsByDayUseCase,
    private readonly getPickToday: GetPickTodayUseCase,
    private readonly acceptOffer: AcceptMissionOfferUseCase,
    private readonly rerollOffer: RerollMissionOfferUseCase,
    private readonly syncMatches: SyncUserMatchesUseCase,
  ) {}

  @Get('home')
  home(@CurrentUser() userId: string) {
    return this.getHome.execute(userId);
  }

  @Get('by-day')
  byDay(@CurrentUser() userId: string, @Query('date') date?: string) {
    return this.getByDay.execute(userId, date);
  }

  @Get('pick/today')
  pickToday(@CurrentUser() userId: string) {
    return this.getPickToday.execute(userId);
  }

  @Post('pick/:offerId/accept')
  accept(
    @CurrentUser() userId: string,
    @Param('offerId') offerId: string,
  ) {
    return this.acceptOffer.execute(userId, offerId);
  }

  @Post('pick/:offerId/reroll')
  reroll(
    @CurrentUser() userId: string,
    @Param('offerId') offerId: string,
  ) {
    return this.rerollOffer.execute(userId, offerId);
  }

  @Post('sync')
  sync(@CurrentUser() userId: string) {
    return this.syncMatches.execute(userId);
  }
}
