import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MissionTemplate, UserMission } from '@prisma/client';
import { MatchSummaryForViewer } from '@modules/riot/domain/entities/match.entity';
import {
  IRiotService,
  isMissionEligibleMatch,
  MatchDto,
  MatchParticipantDto,
  RIOT_SERVICE,
} from '@modules/riot/domain/services/riot.service.interface';
import {
  applyMatchToProgress,
  initialProgress,
} from '../domain/mission-rule.engine';
import { missionExpiresAt } from '../domain/mission-duration.util';
import {
  buildRuleContext,
  matchContributedToFlexSquadWelcome,
  matchContributedToStandardMission,
} from '../domain/mission-match-attribution.util';
import {
  isMatchInMissionWindow,
  matchEndedAtMs,
} from '../domain/mission-timezone.util';
import { PrismaMissionsRepository } from '../infrastructure/persistence/prisma-missions.repository';

const RIOT_HISTORY_COUNT = 30;

export type MissionMatchContribution = 'CONTRIBUTED' | 'NO_PROGRESS' | 'NOT_ELIGIBLE';

export interface MissionMatchEntryDto extends MatchSummaryForViewer {
  eligible: boolean;
  contribution: MissionMatchContribution;
}

export interface MissionMatchesResponseDto {
  missionId: string;
  matches: MissionMatchEntryDto[];
}

type MissionWithRelations = UserMission & {
  template: MissionTemplate;
  missionDay: { userId: string; calendarDate: Date };
  offer: { championId: number | null } | null;
};

interface WindowedMatch {
  match: MatchDto;
  me: MatchParticipantDto;
}

@Injectable()
export class GetMissionMatchesUseCase {
  constructor(
    private readonly repo: PrismaMissionsRepository,
    @Inject(RIOT_SERVICE) private readonly riotService: IRiotService,
  ) {}

  async execute(
    userId: string,
    missionId: string,
  ): Promise<MissionMatchesResponseDto> {
    const mission = await this.repo.findUserMissionById(missionId);
    if (!mission || mission.missionDay.userId !== userId) {
      throw new NotFoundException('Mission not found');
    }

    const account = await this.repo.findRiotAccount(userId);
    if (!account) {
      throw new ForbiddenException();
    }

    if (mission.status === 'OFFER') {
      return { missionId, matches: [] };
    }

    const windowed = await this.collectWindowedMatches(
      userId,
      account.puuid,
      account.region,
      mission,
    );

    const entries = await this.buildEntries(mission, windowed);
    return { missionId, matches: entries };
  }

  private resolveExpiresAt(mission: MissionWithRelations): Date | null {
    if (mission.expiresAt) {
      return mission.expiresAt;
    }
    if (mission.acceptedAt && mission.template.kind === 'STANDARD') {
      return missionExpiresAt(mission.acceptedAt);
    }
    return null;
  }

  private async collectWindowedMatches(
    userId: string,
    puuid: string,
    region: string,
    mission: MissionWithRelations,
  ): Promise<WindowedMatch[]> {
    const acceptedAt = mission.acceptedAt;
    const expiresAt = this.resolveExpiresAt(mission);
    const missionDay = mission.missionDay.calendarDate;

    const byId = new Map<string, MatchDto>();
    const processed = await this.repo.findProcessedMatchesWithPayload(userId);
    for (const row of processed) {
      if (!row.matchPayloadJson) {
        continue;
      }
      const match = row.matchPayloadJson as unknown as MatchDto;
      if (
        isMatchInMissionWindow(match, acceptedAt, expiresAt, missionDay)
      ) {
        byId.set(match.matchId, match);
      }
    }

    try {
      const historyIds = await this.riotService.getMatchHistory(
        puuid,
        region,
        RIOT_HISTORY_COUNT,
      );
      for (const matchId of historyIds) {
        if (byId.has(matchId)) {
          continue;
        }
        try {
          const match = await this.riotService.getMatchDetail(matchId, region);
          if (
            isMatchInMissionWindow(match, acceptedAt, expiresAt, missionDay)
          ) {
            byId.set(match.matchId, match);
          }
        } catch {
          // Skip unavailable matches.
        }
      }
    } catch {
      // History supplement is best-effort.
    }

    const viewer = puuid.trim().toLowerCase();
    const windowed: WindowedMatch[] = [];
    for (const match of byId.values()) {
      const me = match.participants.find(
        (p) => (p.puuid ?? '').trim().toLowerCase() === viewer,
      );
      if (!me) {
        continue;
      }
      windowed.push({ match, me });
    }

    windowed.sort(
      (a, b) => matchEndedAtMs(b.match) - matchEndedAtMs(a.match),
    );
    return windowed;
  }

  private async buildEntries(
    mission: MissionWithRelations,
    windowed: WindowedMatch[],
  ): Promise<MissionMatchEntryDto[]> {
    if (mission.template.ruleType === 'FLEX_SQUAD_WPGG_WIN') {
      return this.buildFlexSquadEntries(mission, windowed);
    }
    return this.buildStandardEntries(mission, windowed);
  }

  private buildStandardEntries(
    mission: MissionWithRelations,
    windowed: WindowedMatch[],
  ): MissionMatchEntryDto[] {
    const ctx = buildRuleContext(
      mission.template.ruleType,
      mission.template.targetJson,
      mission.offer?.championId,
    );

    const chronological = [...windowed].sort(
      (a, b) => matchEndedAtMs(a.match) - matchEndedAtMs(b.match),
    );

    let progress = initialProgress(mission.template.ruleType);
    const contributionByMatchId = new Map<string, MissionMatchContribution>();

    for (const { match, me } of chronological) {
      const eligible = isMissionEligibleMatch(match);
      if (!eligible) {
        contributionByMatchId.set(match.matchId, 'NOT_ELIGIBLE');
        continue;
      }

      const before = { ...progress };
      progress = applyMatchToProgress(ctx, progress, me, match);
      const contributed = matchContributedToStandardMission(
        ctx,
        before,
        progress,
      );
      contributionByMatchId.set(
        match.matchId,
        contributed ? 'CONTRIBUTED' : 'NO_PROGRESS',
      );
    }

    return windowed.map(({ match, me }) => {
      const summary = this.toViewerSummary(match, me);
      const eligible = isMissionEligibleMatch(match);
      return {
        ...summary,
        eligible,
        contribution:
          contributionByMatchId.get(match.matchId) ??
          (eligible ? 'NO_PROGRESS' : 'NOT_ELIGIBLE'),
      };
    });
  }

  private async buildFlexSquadEntries(
    mission: MissionWithRelations,
    windowed: WindowedMatch[],
  ): Promise<MissionMatchEntryDto[]> {
    let bestWpggTeammates = 0;

    const chronological = [...windowed].sort(
      (a, b) => matchEndedAtMs(a.match) - matchEndedAtMs(b.match),
    );

    const contributionByMatchId = new Map<string, MissionMatchContribution>();

    for (const { match, me } of chronological) {
      const eligible = isMissionEligibleMatch(match);
      if (!eligible) {
        contributionByMatchId.set(match.matchId, 'NOT_ELIGIBLE');
        continue;
      }

      const wpggTeammates = await this.countWpggTeammates(match, me);
      const contributed = matchContributedToFlexSquadWelcome(
        match.queueId,
        me.win,
        wpggTeammates,
        bestWpggTeammates,
      );
      if (wpggTeammates > bestWpggTeammates) {
        bestWpggTeammates = wpggTeammates;
      }
      contributionByMatchId.set(
        match.matchId,
        contributed ? 'CONTRIBUTED' : 'NO_PROGRESS',
      );
    }

    return windowed.map(({ match, me }) => {
      const summary = this.toViewerSummary(match, me);
      const eligible = isMissionEligibleMatch(match);
      return {
        ...summary,
        eligible,
        contribution:
          contributionByMatchId.get(match.matchId) ??
          (eligible ? 'NO_PROGRESS' : 'NOT_ELIGIBLE'),
      };
    });
  }

  private async countWpggTeammates(
    match: MatchDto,
    me: MatchParticipantDto,
  ): Promise<number> {
    const teammatePuuids = match.participants
      .filter(
        (p) =>
          p.teamId === me.teamId &&
          p.puuid.toLowerCase() !== me.puuid.toLowerCase(),
      )
      .map((p) => p.puuid);

    return this.repo.countRegisteredPuuids(teammatePuuids);
  }

  private toViewerSummary(
    match: MatchDto,
    me: MatchParticipantDto,
  ): MatchSummaryForViewer {
    const gameEndTimestamp =
      match.gameEndTimestamp ?? match.gameCreation + match.gameDuration * 1000;
    return {
      matchId: match.matchId,
      championId: me.championId,
      championName: me.championName,
      kills: me.kills,
      deaths: me.deaths,
      assists: me.assists,
      win: me.win,
      gameDuration: match.gameDuration,
      durationSeconds: match.gameDuration,
      gameEndTimestamp,
      gameMode: match.gameMode,
      gameCreation: match.gameCreation,
    };
  }
}
