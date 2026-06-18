import { MissionRuleType } from '@prisma/client';
import {
  MissionProgressState,
  MissionTemplateTarget,
} from './mission-rule.engine';

export interface MissionProgressLineDto {
  current: number;
  target: number;
}

function line(current: number, target: number): MissionProgressLineDto {
  return {
    current: Math.max(0, Math.round(current)),
    target: Math.max(0, Math.round(target)),
  };
}

export function missionProgressDetail(
  ruleType: MissionRuleType,
  targetJson: unknown,
  progressJson: unknown,
): MissionProgressLineDto[] {
  const target = (targetJson ?? {}) as MissionTemplateTarget;
  const progress = (progressJson ?? {}) as MissionProgressState;

  switch (ruleType) {
    case 'WIN_EACH_ROLE':
      return [
        line(
          ((progress.rolesWon as string[]) ?? []).length,
          target.rolesRequired ?? 5,
        ),
      ];
    case 'DAILY_CS':
      return [line((progress.csTotal as number) ?? 0, target.csTotal ?? 0)];
    case 'GAMES_VISION_MIN':
    case 'GAMES_KP_MIN':
    case 'GAMES_DAMAGE_TAKEN_WINS':
    case 'GAMES_WIN_STRUCTURE_DAMAGE':
    case 'GAMES_WIN_DAMAGE_CHAMPIONS':
    case 'GAMES_WIN_ASSISTS':
    case 'GAMES_WIN_KILLS':
    case 'GAMES_WIN_FAST':
    case 'GAMES_WIN_MULTIKILL':
    case 'GAMES_WIN_GOLD':
    case 'GAMES_WIN_FIRST_TOWER':
    case 'GAMES_WIN_DEATHS_MAX':
    case 'GAMES_WIN_CS':
      return [
        line(
          (progress.qualifyingGames as number) ?? 0,
          target.gamesRequired ?? target.winsRequired ?? 5,
        ),
      ];
    case 'GAMES_WIN_TOWERS':
      return [
        line(
          (progress.qualifyingGames as number) ?? 0,
          target.gamesRequired ?? 5,
        ),
        line((progress.turretsTotal as number) ?? 0, target.towersMin ?? 15),
      ];
    case 'CHAMPION_GAMES_WINS':
      return [
        line((progress.gamesPlayed as number) ?? 0, target.gamesRequired ?? 10),
        line((progress.wins as number) ?? 0, target.winsRequired ?? 6),
      ];
    case 'DAILY_WARDS_DESTROYED':
    case 'DAILY_WARDS_PLACED':
      return [
        line((progress.wardsTotal as number) ?? 0, target.wardsTotal ?? 0),
      ];
    case 'WIN_STREAK_NO_DEATH':
    case 'WIN_STREAK':
      return [
        line((progress.currentStreak as number) ?? 0, target.streakWins ?? 10),
      ];
    case 'GAMES_WIN_STREAK_PENTAKILL':
      return [
        line((progress.currentStreak as number) ?? 0, target.streakWins ?? 5),
        line(
          (progress.pentasInCurrentStreak as number) ?? 0,
          target.pentasInStreak ?? 2,
        ),
      ];
    case 'WIN_STREAK_EACH_ROLE_NO_DEATH':
      return [
        line(
          ((progress.rolesCompleted as string[]) ?? []).length,
          target.rolesRequired ?? 5,
        ),
      ];
    case 'SINGLE_GAME_HEAL_DAMAGE':
      return [
        line((progress.bestCombined as number) ?? 0, target.combinedMin ?? 0),
      ];
    case 'FLEX_SQUAD_WPGG_WIN':
      return [
        line(
          (progress.wpggTeammates as number) ?? 0,
          target.teammatesRequired ?? 4,
        ),
      ];
    default:
      return [];
  }
}
