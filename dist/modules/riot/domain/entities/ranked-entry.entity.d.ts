export declare class RankedEntryEntity {
    readonly queueType: string;
    readonly tier: string;
    readonly rank: string;
    readonly leaguePoints: number;
    readonly wins: number;
    readonly losses: number;
    readonly hotStreak: boolean;
    constructor(queueType: string, tier: string, rank: string, leaguePoints: number, wins: number, losses: number, hotStreak: boolean);
    getWinRate(): number;
}
