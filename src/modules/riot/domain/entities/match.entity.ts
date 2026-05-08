export interface MatchParticipant {
  puuid: string;
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  totalDamageDealt: number;
}

export class MatchEntity {
  constructor(
    public readonly matchId: string,
    public readonly gameMode: string,
    public readonly gameDuration: number,
    public readonly gameCreation: number,
    public readonly participants: MatchParticipant[],
  ) {}
}
