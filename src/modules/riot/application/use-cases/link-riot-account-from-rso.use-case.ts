import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '@modules/auth/domain/repositories/user.repository.interface';
import { RiotAccountEntity } from '../../domain/entities/riot-account.entity';
import {
  IRiotAccountRepository,
  RIOT_ACCOUNT_REPOSITORY,
} from '../../domain/repositories/riot-account.repository.interface';
import {
  IRiotService,
  RIOT_SERVICE,
} from '../../domain/services/riot.service.interface';
import {
  IRiotSignOnService,
  RIOT_SIGN_ON_SERVICE,
} from '../../domain/services/riot-sign-on.service.interface';
import { isAllowedRiotRegion } from '../riot-regions';

export type LinkRiotAccountFromRsoInput = {
  userId: string;
  accessToken: string;
  cpid?: string;
};

/**
 * Links the WPGG user to their LoL summoner using RSO tokens right after OAuth.
 * Best-effort: returns null on failure without blocking login.
 */
@Injectable()
export class LinkRiotAccountFromRsoUseCase {
  private readonly logger = new Logger(LinkRiotAccountFromRsoUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(RIOT_ACCOUNT_REPOSITORY)
    private readonly riotAccountRepository: IRiotAccountRepository,
    @Inject(RIOT_SIGN_ON_SERVICE)
    private readonly riotSignOn: IRiotSignOnService,
    @Inject(RIOT_SERVICE)
    private readonly riotService: IRiotService,
    private readonly config: ConfigService,
  ) {}

  async execute(
    input: LinkRiotAccountFromRsoInput,
  ): Promise<RiotAccountEntity | null> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      return null;
    }

    const existingByUser = await this.riotAccountRepository.findByUserId(
      input.userId,
    );
    if (existingByUser) {
      return existingByUser;
    }

    const region = this.resolveRegion(input.cpid);
    if (!region) {
      this.logger.warn(
        `RSO auto-link skipped for user ${input.userId}: no valid platform (cpid)`,
      );
      return null;
    }

    let accountMe: { puuid: string; gameName: string; tagLine: string };
    try {
      accountMe = await this.riotSignOn.getAccountMe(input.accessToken);
    } catch (err) {
      this.logger.warn(
        `RSO accounts/me failed for user ${input.userId}: ${
          err instanceof Error ? err.message : err
        }`,
      );
      return null;
    }

    if (!accountMe.gameName?.trim() || !accountMe.tagLine?.trim()) {
      this.logger.warn(
        `RSO auto-link skipped for user ${input.userId}: account missing gameName/tagLine`,
      );
      return null;
    }

    const existingByPuuid = await this.riotAccountRepository.findByPuuid(
      accountMe.puuid,
    );
    if (existingByPuuid) {
      if (existingByPuuid.userId === input.userId) {
        return existingByPuuid;
      }
      this.logger.warn(
        `RSO auto-link skipped: puuid already linked to another user`,
      );
      return null;
    }

    let summonerId = '';
    let accountId = '';
    try {
      const summonerMe = await this.riotSignOn.getLoLSummonerMe(
        input.accessToken,
        region,
      );
      summonerId = summonerMe.summonerId;
      accountId = summonerMe.accountId;
    } catch (err) {
      this.logger.warn(
        `RSO summoners/me failed for ${region}, trying API key fallback: ${
          err instanceof Error ? err.message : err
        }`,
      );
      try {
        const platformSummoner = await this.riotService.getSummonerByPuuid(
          accountMe.puuid,
          region,
        );
        summonerId = platformSummoner.summonerId;
        accountId = platformSummoner.accountId;
      } catch (fallbackErr) {
        this.logger.warn(
          `RSO auto-link summoner lookup failed for user ${input.userId}: ${
            fallbackErr instanceof Error ? fallbackErr.message : fallbackErr
          }`,
        );
        return null;
      }
    }

    const entity = RiotAccountEntity.create({
      id: randomUUID(),
      userId: input.userId,
      puuid: accountMe.puuid,
      gameName: accountMe.gameName.trim(),
      tagLine: accountMe.tagLine.trim(),
      region,
      summonerId,
      accountId,
    });

    try {
      return await this.riotAccountRepository.save(entity);
    } catch (err) {
      this.logger.warn(
        `RSO auto-link save failed for user ${input.userId}: ${
          err instanceof Error ? err.message : err
        }`,
      );
      return null;
    }
  }

  private resolveRegion(cpid?: string): string | null {
    const fromCpid = cpid?.trim().toUpperCase();
    if (fromCpid && isAllowedRiotRegion(fromCpid)) {
      return fromCpid;
    }

    const fallback =
      this.config.get<string>('RIOT_DEFAULT_LINK_REGION')?.trim().toUpperCase() ??
      'LA2';
    if (isAllowedRiotRegion(fallback)) {
      return fallback;
    }
    return isAllowedRiotRegion('LA2') ? 'LA2' : null;
  }
}
