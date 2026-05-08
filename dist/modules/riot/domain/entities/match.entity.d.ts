export interface MatchParticipant {
    puuid: string;
    championName: string;
    kills: number;
    deaths: number;
    assists: number;
    win: boolean;
    totalDamageDealt: number;
}
export declare class MatchEntity {
    readonly matchId: string;
    readonly gameMode: string;
    readonly gameDuration: number;
    readonly gameCreation: number;
    readonly participants: MatchParticipant[];
    constructor(matchId: string, gameMode: string, gameDuration: number, gameCreation: number, participants: MatchParticipant[]);
}
