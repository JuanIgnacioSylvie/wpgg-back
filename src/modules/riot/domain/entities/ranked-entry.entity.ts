export class RankedEntryEntity {
  constructor(
    public readonly queueType: string,
    public readonly tier: string,
    public readonly rank: string,
    public readonly leaguePoints: number,
    public readonly wins: number,
    public readonly losses: number,
    public readonly hotStreak: boolean,
  ) {}

  getWinRate(): number {
    const total = this.wins + this.losses;
    return total === 0 ? 0 : Math.round((this.wins / total) * 100);
  }
}
