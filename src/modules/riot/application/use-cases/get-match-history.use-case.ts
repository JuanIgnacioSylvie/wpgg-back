import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { MatchEntity } from '../../domain/entities/match.entity';
import {
  IRiotAccountRepository,
  RIOT_ACCOUNT_REPOSITORY,
} from '../../domain/repositories/riot-account.repository.interface';
import {
  IRiotService,
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

  async execute(userId: string): Promise<MatchEntity[]> {
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

    return details.map(
      (m) =>
        new MatchEntity(
          m.matchId,
          m.gameMode,
          m.gameDuration,
          m.gameCreation,
          m.participants.map((p) => ({
            puuid: p.puuid,
            championName: p.championName,
            kills: p.kills,
            deaths: p.deaths,
            assists: p.assists,
            win: p.win,
            totalDamageDealt: p.totalDamageDealt,
          })),
        ),
    );
  }

  async executeMatchDetail(
    userId: string,
    matchId: string,
  ): Promise<MatchEntity> {
    const account = await this.riotAccountRepository.findByUserId(userId);
    if (!account) {
      throw new ForbiddenException();
    }

    const m = await this.riotService.getMatchDetail(matchId, account.region);
    return new MatchEntity(
      m.matchId,
      m.gameMode,
      m.gameDuration,
      m.gameCreation,
      m.participants.map((p) => ({
        puuid: p.puuid,
        championName: p.championName,
        kills: p.kills,
        deaths: p.deaths,
        assists: p.assists,
        win: p.win,
        totalDamageDealt: p.totalDamageDealt,
      })),
    );
  }
}
