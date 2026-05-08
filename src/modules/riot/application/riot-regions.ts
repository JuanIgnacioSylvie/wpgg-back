/** Regions allowed for link / summoner routing (Requirement 5.6). */
export const ALLOWED_RIOT_REGIONS = [
  'EUW1',
  'NA1',
  'KR',
  'BR1',
  'EUN1',
  'JP1',
  'LA1',
  'LA2',
  'OC1',
  'TR1',
  'RU',
  'PH2',
  'SG2',
  'TH2',
  'TW2',
  'VN2',
] as const;

export type AllowedRiotRegion = (typeof ALLOWED_RIOT_REGIONS)[number];

export function isAllowedRiotRegion(r: string): r is AllowedRiotRegion {
  return (ALLOWED_RIOT_REGIONS as readonly string[]).includes(r);
}
