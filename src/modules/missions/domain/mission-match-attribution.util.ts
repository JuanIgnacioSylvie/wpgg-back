import { RANKED_FLEX_QUEUE_ID } from '@modules/riot/domain/services/riot.service.interface';
import {
  MissionProgressState,
  MissionTemplateTarget,
  progressPercentFromState,
  RuleEvaluationContext,
} from './mission-rule.engine';

export function isProgressImproved(
  ctx: RuleEvaluationContext,
  before: MissionProgressState,
  after: MissionProgressState,
): boolean {
  const percentBefore = progressPercentFromState(ctx, before);
  const percentAfter = progressPercentFromState(ctx, after);
  return percentAfter > percentBefore;
}

export function matchContributedToStandardMission(
  ctx: RuleEvaluationContext,
  progressBefore: MissionProgressState,
  progressAfter: MissionProgressState,
): boolean {
  return isProgressImproved(ctx, progressBefore, progressAfter);
}

export function matchContributedToFlexSquadWelcome(
  matchQueueId: number,
  won: boolean,
  wpggTeammates: number,
  bestBefore: number,
): boolean {
  return (
    matchQueueId === RANKED_FLEX_QUEUE_ID &&
    won &&
    wpggTeammates > bestBefore
  );
}

export function buildRuleContext(
  ruleType: RuleEvaluationContext['ruleType'],
  targetJson: unknown,
  championId?: number | null,
): RuleEvaluationContext {
  return {
    ruleType,
    target: targetJson as MissionTemplateTarget,
    championId: championId ?? null,
  };
}
