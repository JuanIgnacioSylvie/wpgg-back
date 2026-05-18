import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '@shared/infrastructure/guards/jwt-auth.guard';
import { GetMatchHistoryUseCase } from '../application/use-cases/get-match-history.use-case';
import { GetRankedStatsUseCase } from '../application/use-cases/get-ranked-stats.use-case';
import { GetSummonerProfileUseCase } from '../application/use-cases/get-summoner-profile.use-case';
import { LinkRiotAccountUseCase } from '../application/use-cases/link-riot-account.use-case';
import { LinkRiotAccountRequestDto } from './dto/link-riot-account-request.dto';

@Controller('riot')
@UseGuards(JwtAuthGuard)
export class RiotController {
  constructor(
    private readonly linkRiot: LinkRiotAccountUseCase,
    private readonly summonerProfile: GetSummonerProfileUseCase,
    private readonly matchHistory: GetMatchHistoryUseCase,
    private readonly rankedStats: GetRankedStatsUseCase,
  ) {}

  @Post('link')
  @HttpCode(HttpStatus.CREATED)
  async link(
    @CurrentUser() userId: string,
    @Body() body: LinkRiotAccountRequestDto,
  ) {
    const summoner = await this.linkRiot.execute({
      userId,
      gameName: body.gameName,
      tagLine: body.tagLine,
      region: body.region,
    });
    return {
      id: summoner.id,
      userId: summoner.userId,
      puuid: summoner.puuid,
      gameName: summoner.gameName,
      tagLine: summoner.tagLine,
      region: summoner.region,
      summonerId: summoner.summonerId,
      accountId: summoner.accountId,
      linkedAt: summoner.linkedAt,
    };
  }

  @Get('summoner')
  async getSummoner(@CurrentUser() userId: string) {
    const profile = await this.summonerProfile.execute(userId);
    const s = profile.summoner;
    return {
      puuid: s.puuid,
      summonerId: s.summonerId,
      accountId: s.accountId,
      profileIconId: s.profileIconId,
      summonerLevel: s.summonerLevel,
      revisionDate: s.revisionDate,
      gameName: profile.gameName,
      tagLine: profile.tagLine,
      region: profile.region,
    };
  }

  @Get('matches/:matchId')
  async getMatch(
    @CurrentUser() userId: string,
    @Param('matchId') matchId: string,
  ) {
    return this.matchHistory.executeMatchDetail(userId, matchId);
  }

  @Get('matches')
  async getMatches(
    @CurrentUser() userId: string,
    @Query('limit') limit?: string,
  ) {
    const parsed = limit != null ? Number.parseInt(limit, 10) : 10;
    const safeLimit = Number.isFinite(parsed) ? parsed : 10;
    return this.matchHistory.execute(userId, safeLimit);
  }

  @Get('ranked')
  async getRanked(@CurrentUser() userId: string) {
    const rows = await this.rankedStats.execute(userId);
    return rows.map((r) => ({
      queueType: r.queueType,
      tier: r.tier,
      rank: r.rank,
      leaguePoints: r.leaguePoints,
      wins: r.wins,
      losses: r.losses,
      hotStreak: r.hotStreak,
      winRate: r.getWinRate(),
    }));
  }
}
