import { GetMatchHistoryUseCase } from '../application/use-cases/get-match-history.use-case';
import { GetRankedStatsUseCase } from '../application/use-cases/get-ranked-stats.use-case';
import { GetSummonerProfileUseCase } from '../application/use-cases/get-summoner-profile.use-case';
import { LinkRiotAccountUseCase } from '../application/use-cases/link-riot-account.use-case';
import { LinkRiotAccountRequestDto } from './dto/link-riot-account-request.dto';
export declare class RiotController {
    private readonly linkRiot;
    private readonly summonerProfile;
    private readonly matchHistory;
    private readonly rankedStats;
    constructor(linkRiot: LinkRiotAccountUseCase, summonerProfile: GetSummonerProfileUseCase, matchHistory: GetMatchHistoryUseCase, rankedStats: GetRankedStatsUseCase);
    link(userId: string, body: LinkRiotAccountRequestDto): Promise<{
        id: string;
        userId: string;
        puuid: string;
        gameName: string;
        tagLine: string;
        region: string;
        summonerId: string;
        accountId: string;
        linkedAt: Date;
    }>;
    getSummoner(userId: string): Promise<{
        puuid: string;
        summonerId: string;
        accountId: string;
        profileIconId: number;
        summonerLevel: number;
        revisionDate: number;
    }>;
    getMatch(userId: string, matchId: string): Promise<{
        matchId: string;
        gameMode: string;
        gameDuration: number;
        gameCreation: number;
        participants: import("../domain/entities/match.entity").MatchParticipant[];
    }>;
    getMatches(userId: string): Promise<{
        matchId: string;
        gameMode: string;
        gameDuration: number;
        gameCreation: number;
        participants: import("../domain/entities/match.entity").MatchParticipant[];
    }[]>;
    getRanked(userId: string): Promise<{
        queueType: string;
        tier: string;
        rank: string;
        leaguePoints: number;
        wins: number;
        losses: number;
        hotStreak: boolean;
        winRate: number;
    }[]>;
}
