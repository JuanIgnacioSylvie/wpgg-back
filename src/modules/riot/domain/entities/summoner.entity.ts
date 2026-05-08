export class SummonerEntity {
  constructor(
    public readonly puuid: string,
    public readonly summonerId: string,
    public readonly accountId: string,
    public readonly profileIconId: number,
    public readonly summonerLevel: number,
    public readonly revisionDate: number,
  ) {}
}
