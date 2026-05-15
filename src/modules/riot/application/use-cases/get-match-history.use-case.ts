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

  async execute(userId: string): Promise<MatchSummaryForViewer[]> {
    const account = await this.riotAccountRepository.findByUserId(userId);
    if (!account) {
      throw new ForbiddenException();
    }

    const matchIds = await this.riotService.getMatchHistory(
      account.puuid,
      account.region,
      20,
    );

    const details = await Promise.all(
      matchIds.map((id) =>
        this.riotService.getMatchDetail(id, account.region),
      ),
    );

    return details
      .map((m) => this.tryViewerSummary(m, account.puuid))
      .filter((x): x is MatchSummaryForViewer => x != null);
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
    const me = m.participants.find((p) => p.puuid === viewerPuuid);
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
