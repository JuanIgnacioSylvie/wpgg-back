import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MatchSummaryForViewer,
} from '../../domain/entities/match.entity';
import {
  IRiotAccountRepository,
  RIOT_ACCOUNT_REPOSITORY,
} from '../../domain/repositories/riot-account.repository.interface';
import {
  IRiotService,
  MatchDto,
  RIOT_SERVICE,
} from '../../domain/services/riot.service.interface';

@Injectable()
export class GetMatchHistoryUseCase {
  constructor(
    @Inject(RIOT_ACCOUNT_REPOSITORY)
    private readonly riotAccountRepository: IRiotAccountRepository,
    @Inject(RIOT_SERVICE)
    private readonly riotService: IRiotService,
  ) {}

  async execute(
    userId: string,
    limit = 10,
  ): Promise<MatchSummaryForViewer[]> {
    const account = await this.riotAccountRepository.findByUserId(userId);
    if (!account) {
      throw new ForbiddenException();
    }

    const count = Math.min(Math.max(limit, 1), 20);
    const matchIds = await this.riotService.getMatchHistory(
      account.puuid,
      account.region,
      count,
    );

    if (matchIds.length === 0) {
      return [];
    }

    const settled = await Promise.allSettled(
      matchIds.map((id) =>
        this.riotService.getMatchDetail(id, account.region),
      ),
    );

    const summaries: MatchSummaryForViewer[] = [];
    for (const result of settled) {
      if (result.status !== 'fulfilled') {
        continue;
      }
      const summary = this.tryViewerSummary(result.value, account.puuid);
      if (summary != null) {
        summaries.push(summary);
      }
    }

    return summaries;
  }

  async executeMatchDetail(
    userId: string,
    matchId: string,
  ): Promise<MatchSummaryForViewer> {
    const account = await this.riotAccountRepository.findByUserId(userId);
    if (!account) {
      throw new ForbiddenException();
    }

    const m = await this.riotService.getMatchDetail(matchId, account.region);
    const summary = this.tryViewerSummary(m, account.puuid);
    if (!summary) {
      throw new NotFoundException(
        `Participant not found in match ${m.matchId}`,
      );
    }
    return summary;
  }

  private tryViewerSummary(
    m: MatchDto,
    viewerPuuid: string,
  ): MatchSummaryForViewer | null {
    const viewer = viewerPuuid.trim().toLowerCase();
    const me = m.participants.find(
      (p) => (p.puuid ?? '').trim().toLowerCase() === viewer,
    );
    if (!me) {
      return null;
    }
    const gameEndTimestamp =
      m.gameEndTimestamp ?? m.gameCreation + m.gameDuration * 1000;
    return {
      matchId: m.matchId,
      championId: me.championId,
      championName: me.championName,
      kills: me.kills,
      deaths: me.deaths,
      assists: me.assists,
      win: me.win,
      gameDuration: m.gameDuration,
      durationSeconds: m.gameDuration,
      gameEndTimestamp,
      gameMode: m.gameMode,
      gameCreation: m.gameCreation,
    };
  }
}
