import { MissionRuleType } from '@prisma/client';
import {
  MatchDto,
  MatchParticipantDto,
} from '@modules/riot/domain/services/riot.service.interface';

export type MissionProgressState = Record<string, unknown>;

export interface MissionTemplateTarget {
  rolesRequired?: number;
  csTotal?: number;
  gamesRequired?: number;
  visionMin?: number;
  kpMin?: number;
  winsRequired?: number;
  wardsTotal?: number;
  streakWins?: number;
  pentasInStreak?: number;
  streakPerRole?: number;
  combinedMin?: number;
  damageTakenMin?: number;
  teammatesRequired?: number;
}

export interface RuleEvaluationContext {
  ruleType: MissionRuleType;
  target: MissionTemplateTarget;
  championId?: number | null;
}

const ROLES = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'] as const;

function csOf(p: MatchParticipantDto): number {
  return p.totalMinionsKilled + p.neutralMinionsKilled;
}

function healDamageCombined(p: MatchParticipantDto): number {
  return p.totalHeal + p.totalHealsOnTeammates + p.totalDamageDealtToChampions;
}

function clampPercent(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)));
}

export function initialProgress(
  ruleType: MissionRuleType,
): MissionProgressState {
  switch (ruleType) {
    case 'WIN_EACH_ROLE':
      return { rolesWon: [] as string[] };
    case 'DAILY_CS':
      return { csTotal: 0 };
    case 'GAMES_VISION_MIN':
    case 'GAMES_KP_MIN':
    case 'GAMES_DAMAGE_TAKEN_WINS':
      return { qualifyingGames: 0 };
    case 'CHAMPION_GAMES_WINS':
      return { gamesPlayed: 0, wins: 0 };
    case 'DAILY_WARDS_DESTROYED':
      return { wardsTotal: 0 };
    case 'WIN_STREAK_NO_DEATH':
      return { currentStreak: 0, bestStreak: 0 };
    case 'GAMES_WIN_STREAK_PENTAKILL':
      return { currentStreak: 0, pentasInCurrentStreak: 0, bestQualified: false };
    case 'WIN_STREAK_EACH_ROLE_NO_DEATH':
      return {
        roleStreaks: {} as Record<string, number>,
        rolesCompleted: [] as string[],
      };
    case 'SINGLE_GAME_HEAL_DAMAGE':
      return { bestCombined: 0 };
    case 'FLEX_SQUAD_WPGG_WIN':
      return { wpggTeammates: 0 };
    default:
      return {};
  }
}

export function applyMatchToProgress(
  ctx: RuleEvaluationContext,
  progress: MissionProgressState,
  participant: MatchParticipantDto,
  _match: MatchDto,
): MissionProgressState {
  const t = ctx.target;
  const next = { ...progress };

  switch (ctx.ruleType) {
    case 'WIN_EACH_ROLE': {
      const rolesWon = new Set((next.rolesWon as string[]) ?? []);
      if (participant.win && participant.teamPosition !== 'NONE') {
        rolesWon.add(participant.teamPosition);
      }
      next.rolesWon = [...rolesWon];
      break;
    }
    case 'DAILY_CS':
      next.csTotal = ((next.csTotal as number) ?? 0) + csOf(participant);
      break;
    case 'GAMES_VISION_MIN':
      if (participant.visionScore >= (t.visionMin ?? 0)) {
        next.qualifyingGames = ((next.qualifyingGames as number) ?? 0) + 1;
      }
      break;
    case 'GAMES_KP_MIN':
      if (participant.killParticipation >= (t.kpMin ?? 0)) {
        next.qualifyingGames = ((next.qualifyingGames as number) ?? 0) + 1;
      }
      break;
    case 'CHAMPION_GAMES_WINS': {
      if (
        ctx.championId != null &&
        participant.championId === ctx.championId
      ) {
        next.gamesPlayed = ((next.gamesPlayed as number) ?? 0) + 1;
        if (participant.win) {
          next.wins = ((next.wins as number) ?? 0) + 1;
        }
      }
      break;
    }
    case 'DAILY_WARDS_DESTROYED':
      next.wardsTotal =
        ((next.wardsTotal as number) ?? 0) + participant.wardsKilled;
      break;
    case 'WIN_STREAK_NO_DEATH': {
      let current = (next.currentStreak as number) ?? 0;
      let best = (next.bestStreak as number) ?? 0;
      if (participant.win && participant.deaths === 0) {
        current += 1;
        best = Math.max(best, current);
      } else {
        current = 0;
      }
      next.currentStreak = current;
      next.bestStreak = best;
      break;
    }
    case 'GAMES_WIN_STREAK_PENTAKILL': {
      let streak = (next.currentStreak as number) ?? 0;
      let pentas = (next.pentasInCurrentStreak as number) ?? 0;
      if (participant.win) {
        streak += 1;
        if (participant.pentaKills > 0) {
          pentas += participant.pentaKills;
        }
      } else {
        streak = 0;
        pentas = 0;
      }
      next.currentStreak = streak;
      next.pentasInCurrentStreak = pentas;
      const needStreak = t.streakWins ?? 5;
      const needPentas = t.pentasInStreak ?? 2;
      next.bestQualified =
        streak >= needStreak && pentas >= needPentas;
      break;
    }
    case 'WIN_STREAK_EACH_ROLE_NO_DEATH': {
      const roleStreaks = {
        ...((next.roleStreaks as Record<string, number>) ?? {}),
      };
      const rolesCompleted = new Set(
        (next.rolesCompleted as string[]) ?? [],
      );
      const role = participant.teamPosition;
      if (ROLES.includes(role as (typeof ROLES)[number])) {
        if (participant.win && participant.deaths === 0) {
          roleStreaks[role] = (roleStreaks[role] ?? 0) + 1;
          if (roleStreaks[role] >= (t.streakPerRole ?? 5)) {
            rolesCompleted.add(role);
          }
        } else {
          roleStreaks[role] = 0;
        }
      }
      next.roleStreaks = roleStreaks;
      next.rolesCompleted = [...rolesCompleted];
      break;
    }
    case 'SINGLE_GAME_HEAL_DAMAGE': {
      const combined = healDamageCombined(participant);
      next.bestCombined = Math.max(
        (next.bestCombined as number) ?? 0,
        combined,
      );
      break;
    }
    case 'GAMES_DAMAGE_TAKEN_WINS':
      if (
        participant.win &&
        participant.totalDamageTaken >= (t.damageTakenMin ?? 0)
      ) {
        next.qualifyingGames = ((next.qualifyingGames as number) ?? 0) + 1;
      }
      break;
    default:
      break;
  }

  return next;
}

export function progressPercentFromState(
  ctx: RuleEvaluationContext,
  progress: MissionProgressState,
): number {
  const t = ctx.target;

  switch (ctx.ruleType) {
    case 'WIN_EACH_ROLE': {
      const count = ((progress.rolesWon as string[]) ?? []).length;
      const need = t.rolesRequired ?? 5;
      return clampPercent((count / need) * 100);
    }
    case 'DAILY_CS': {
      const cs = (progress.csTotal as number) ?? 0;
      return clampPercent((cs / (t.csTotal ?? 1)) * 100);
    }
    case 'GAMES_VISION_MIN':
    case 'GAMES_KP_MIN':
    case 'GAMES_DAMAGE_TAKEN_WINS': {
      const g = (progress.qualifyingGames as number) ?? 0;
      const need =
        t.gamesRequired ?? t.winsRequired ?? 5;
      return clampPercent((g / need) * 100);
    }
    case 'CHAMPION_GAMES_WINS': {
      const games = (progress.gamesPlayed as number) ?? 0;
      const wins = (progress.wins as number) ?? 0;
      const gamesNeed = t.gamesRequired ?? 10;
      const winsNeed = t.winsRequired ?? 6;
      const gamePct = games / gamesNeed;
      const winPct = wins / winsNeed;
      return clampPercent(Math.min(gamePct, winPct) * 100);
    }
    case 'DAILY_WARDS_DESTROYED': {
      const w = (progress.wardsTotal as number) ?? 0;
      return clampPercent((w / (t.wardsTotal ?? 1)) * 100);
    }
    case 'WIN_STREAK_NO_DEATH': {
      const best = (progress.bestStreak as number) ?? 0;
      return clampPercent((best / (t.streakWins ?? 10)) * 100);
    }
    case 'GAMES_WIN_STREAK_PENTAKILL': {
      if (progress.bestQualified) {
        return 100;
      }
      const streak = (progress.currentStreak as number) ?? 0;
      const pentas = (progress.pentasInCurrentStreak as number) ?? 0;
      const streakPct = streak / (t.streakWins ?? 5);
      const pentaPct = pentas / (t.pentasInStreak ?? 2);
      return clampPercent(Math.min(streakPct, pentaPct) * 100);
    }
    case 'WIN_STREAK_EACH_ROLE_NO_DEATH': {
      const done = ((progress.rolesCompleted as string[]) ?? []).length;
      return clampPercent((done / (t.rolesRequired ?? 5)) * 100);
    }
    case 'SINGLE_GAME_HEAL_DAMAGE': {
      const best = (progress.bestCombined as number) ?? 0;
      return clampPercent((best / (t.combinedMin ?? 1)) * 100);
    }
    case 'FLEX_SQUAD_WPGG_WIN': {
      const count = (progress.wpggTeammates as number) ?? 0;
      const need = t.teammatesRequired ?? 4;
      return clampPercent((count / need) * 100);
    }
    default:
      return 0;
  }
}

export function isMissionComplete(
  ctx: RuleEvaluationContext,
  progress: MissionProgressState,
): boolean {
  return progressPercentFromState(ctx, progress) >= 100;
}
