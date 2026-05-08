import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { RankedEntryEntity } from '../../domain/entities/ranked-entry.entity';
import {
  IRiotAccountRepository,
  RIOT_ACCOUNT_REPOSITORY,
} from '../../domain/repositories/riot-account.repository.interface';
import {
  IRiotService,
  RIOT_SERVICE,
} from '../../domain/services/riot.service.interface';

@Injectable()
export class GetRankedStatsUseCase {
  constructor(
    @Inject(RIOT_ACCOUNT_REPOSITORY)
    private readonly riotAccountRepository: IRiotAccountRepository,
    @Inject(RIOT_SERVICE)
    private readonly riotService: IRiotService,
  ) {}

  async execute(userId: string): Promise<RankedEntryEntity[]> {
    const account = await this.riotAccountRepository.findByUserId(userId);
    if (!account) {
      throw new ForbiddenException();
    }

    try {
      const rows = await this.riotService.getRankedStats(
        account.summonerId,
        account.region,
      );
      return rows.map(
        (r) =>
          new RankedEntryEntity(
            r.queueType,
            r.tier,
            r.rank,
            r.leaguePoints,
            r.wins,
            r.losses,
            r.hotStreak,
          ),
      );
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new HttpException(
        'Riot API unavailable, please try again later',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
