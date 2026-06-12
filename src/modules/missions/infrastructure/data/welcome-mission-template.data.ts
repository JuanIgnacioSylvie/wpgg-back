import { Prisma } from '@prisma/client';
import { MissionTemplateSeed } from './mission-templates.data';

export const WELCOME_MISSION_TEMPLATE: MissionTemplateSeed = {
  slug: 'welcome',
  category: 'WELCOME',
  kind: 'WELCOME',
  difficulty: 'EASY',
  ruleType: 'FLEX_SQUAD_WPGG_WIN',
  titleEs: 'Jugá una Flex con 4 jugadores de WPGG',
  titleEn: 'Play a Flex game with 4 WPGG players',
  subtitleEs:
    'Completá una partida de Flex en la que los 5 de tu equipo tengan cuenta en WPGG con Riot vinculado. Tenés que ganar la partida.',
  subtitleEn:
    'Complete a Flex game where all 5 players on your team have a WPGG account with a linked Riot profile. You must win the game.',
  targetJson: { teammatesRequired: 4 } satisfies Prisma.InputJsonValue,
  rewardWpgg: 100,
  sortOrder: 0,
};
