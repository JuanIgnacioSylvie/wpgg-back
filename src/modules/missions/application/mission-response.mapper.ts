import {
  MissionCategory,
  MissionDifficulty,
  MissionOffer,
  MissionTemplate,
  MissionTemplateKind,
  UserMission,
  UserMissionStatus,
} from '@prisma/client';

export interface MissionCardDto {
  id: string;
  offerId?: string;
  kind: MissionTemplateKind;
  category: MissionCategory;
  difficulty: MissionDifficulty;
  titleEs: string;
  titleEn: string;
  subtitleEs?: string | null;
  subtitleEn?: string | null;
  rewardWpgg: number;
  status: UserMissionStatus;
  progressPercent: number;
  championId?: number | null;
  endsAt?: string;
}

function difficultyRank(d: MissionDifficulty): number {
  if (d === 'HARD') {
    return 3;
  }
  if (d === 'MEDIUM') {
    return 2;
  }
  return 1;
}

export function mapUserMission(
  um: UserMission & { template: MissionTemplate },
  offer?: MissionOffer | null,
): MissionCardDto {
  return {
    id: um.id,
    offerId: um.offerId ?? offer?.id,
    kind: um.template.kind,
    category: um.template.category,
    difficulty: um.template.difficulty,
    titleEs: um.template.titleEs,
    titleEn: um.template.titleEn,
    subtitleEs: um.template.subtitleEs,
    subtitleEn: um.template.subtitleEn,
    rewardWpgg: um.template.rewardWpgg,
    status: um.status,
    progressPercent: um.progressPercent,
    championId: offer?.championId ?? null,
  };
}

export function mapOffer(
  offer: MissionOffer & { template: MissionTemplate },
  accepted: boolean,
): MissionCardDto {
  return {
    id: offer.id,
    offerId: offer.id,
    kind: offer.template.kind,
    category: offer.template.category,
    difficulty: offer.template.difficulty,
    titleEs: offer.template.titleEs,
    titleEn: offer.template.titleEn,
    subtitleEs: offer.template.subtitleEs,
    subtitleEn: offer.template.subtitleEn,
    rewardWpgg: offer.template.rewardWpgg,
    status: accepted ? 'ACTIVE' : 'OFFER',
    progressPercent: 0,
    championId: offer.championId,
  };
}

export function isStandardMission(card: MissionCardDto): boolean {
  return card.kind === 'STANDARD';
}

export function pickPrimaryMission(
  active: MissionCardDto[],
): MissionCardDto | null {
  if (active.length === 0) {
    return null;
  }
  const sorted = [...active].sort(
    (a, b) => difficultyRank(b.difficulty) - difficultyRank(a.difficulty),
  );
  return sorted[0];
}

export function pickSecondaryMissions(
  active: MissionCardDto[],
  primary: MissionCardDto | null,
): MissionCardDto[] {
  return active.filter((m) => m.id !== primary?.id);
}
