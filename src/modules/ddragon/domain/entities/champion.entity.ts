export class ChampionEntity {
  constructor(
    public readonly id: string,
    public readonly key: string,
    public readonly name: string,
    public readonly title: string,
    public readonly blurb: string,
    public readonly tags: string[],
    public readonly stats: ChampionStats,
    public readonly imageUrl: string,
  ) {}
}

export interface ChampionStats {
  hp: number;
  armor: number;
  spellblock: number;
  attackdamage: number;
  attackspeed: number;
  movespeed: number;
}
