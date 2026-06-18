export interface MissionChampionInfo {
  key: string;
  name: string;
}

/** Champions used in random CHAMPION_GAMES_WINS offers (Riot numeric id). */
export const MISSION_CHAMPION_CATALOG: Record<number, MissionChampionInfo> = {
  1: { key: 'Annie', name: 'Annie' },
  8: { key: 'Vladimir', name: 'Vladimir' },
  12: { key: 'Alistar', name: 'Alistar' },
  13: { key: 'Ryze', name: 'Ryze' },
  14: { key: 'Sion', name: 'Sion' },
  15: { key: 'Sivir', name: 'Sivir' },
  16: { key: 'Soraka', name: 'Soraka' },
  17: { key: 'Teemo', name: 'Teemo' },
  18: { key: 'Tristana', name: 'Tristana' },
  19: { key: 'Warwick', name: 'Warwick' },
  20: { key: 'Nunu', name: 'Nunu & Willump' },
  21: { key: 'Urgot', name: 'Urgot' },
  22: { key: 'Ashe', name: 'Ashe' },
  28: { key: 'Evelynn', name: 'Evelynn' },
  32: { key: 'Amumu', name: 'Amumu' },
  34: { key: 'Anivia', name: 'Anivia' },
  53: { key: 'Blitzcrank', name: 'Blitzcrank' },
  60: { key: 'Elise', name: 'Elise' },
  62: { key: 'Wukong', name: 'Wukong' },
  63: { key: 'Brand', name: 'Brand' },
  67: { key: 'Vayne', name: 'Vayne' },
  68: { key: 'Rumble', name: 'Rumble' },
  69: { key: 'Cassiopeia', name: 'Cassiopeia' },
  84: { key: 'Akali', name: 'Akali' },
  101: { key: 'Xerath', name: 'Xerath' },
  103: { key: 'Ahri', name: 'Ahri' },
  119: { key: 'Draven', name: 'Draven' },
  122: { key: 'Darius', name: 'Darius' },
  136: { key: 'AurelionSol', name: 'Aurelion Sol' },
  201: { key: 'Braum', name: 'Braum' },
  233: { key: 'TahmKench', name: 'Tahm Kench' },
  245: { key: 'Ekko', name: 'Ekko' },
  412: { key: 'Thresh', name: 'Thresh' },
};

export function resolveMissionChampion(
  championId?: number | null,
): MissionChampionInfo | null {
  if (championId == null || championId <= 0) {
    return null;
  }
  return MISSION_CHAMPION_CATALOG[championId] ?? null;
}
