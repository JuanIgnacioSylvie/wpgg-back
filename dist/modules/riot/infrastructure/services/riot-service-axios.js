"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiotServiceAxios = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
const AMERICAS = new Set(['NA1', 'BR1', 'LA1', 'LA2', 'OC1']);
const EUROPE = new Set(['EUW1', 'EUN1', 'TR1', 'RU']);
const ASIA = new Set(['KR', 'JP1']);
const SEA = new Set(['PH2', 'SG2', 'TH2', 'TW2', 'VN2']);
function routingCluster(region) {
    const r = region.toUpperCase();
    if (AMERICAS.has(r)) {
        return 'americas';
    }
    if (EUROPE.has(r)) {
        return 'europe';
    }
    if (ASIA.has(r)) {
        return 'asia';
    }
    if (SEA.has(r)) {
        return 'sea';
    }
    return 'europe';
}
function platformHost(region) {
    return `${region.toLowerCase()}.api.riotgames.com`;
}
let RiotServiceAxios = class RiotServiceAxios {
    constructor(configService) {
        const apiKey = configService.get('RIOT_API_KEY');
        this.http = axios_1.default.create({
            timeout: 5000,
            headers: { 'X-Riot-Token': apiKey },
            validateStatus: () => true,
        });
    }
    async safeGet(url) {
        try {
            return await this.http.get(url);
        }
        catch {
            throw new common_1.HttpException('Riot API unavailable, please try again later', common_1.HttpStatus.BAD_GATEWAY);
        }
    }
    async getAccountByRiotId(gameName, tagLine, region) {
        const cluster = routingCluster(region);
        const url = `https://${cluster}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
        const res = await this.safeGet(url);
        if (res.status === 404) {
            throw new common_1.NotFoundException('Riot account not found');
        }
        if (res.status === 429) {
            throw new common_1.HttpException('Rate limit exceeded, try again later', common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        if (res.status >= 500 || res.status === 0) {
            throw new common_1.HttpException('Riot API unavailable, please try again later', common_1.HttpStatus.BAD_GATEWAY);
        }
        if (res.status !== 200) {
            throw new common_1.HttpException('Riot API unavailable, please try again later', common_1.HttpStatus.BAD_GATEWAY);
        }
        const d = res.data;
        return { puuid: d.puuid, gameName: d.gameName, tagLine: d.tagLine };
    }
    async getSummonerByPuuid(puuid, region) {
        const host = platformHost(region);
        const url = `https://${host}/lol/summoner/v4/summoners/by-puuid/${puuid}`;
        const res = await this.safeGet(url);
        if (res.status === 404) {
            throw new common_1.NotFoundException();
        }
        if (res.status >= 500 || res.status === 0) {
            throw new common_1.HttpException('Riot API unavailable, please try again later', common_1.HttpStatus.BAD_GATEWAY);
        }
        if (res.status !== 200) {
            throw new common_1.HttpException('Riot API unavailable, please try again later', common_1.HttpStatus.BAD_GATEWAY);
        }
        const d = res.data;
        return {
            puuid: d.puuid,
            summonerId: d.id,
            accountId: d.accountId,
            profileIconId: d.profileIconId,
            summonerLevel: d.summonerLevel,
            revisionDate: d.revisionDate,
        };
    }
    async getMatchHistory(puuid, region, count) {
        const cluster = routingCluster(region);
        const url = `https://${cluster}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}`;
        const res = await this.safeGet(url);
        if (res.status >= 400) {
            throw new common_1.HttpException(res.data?.status?.message ?? 'Riot API error', res.status);
        }
        return res.data;
    }
    async getMatchDetail(matchId, region) {
        const cluster = routingCluster(region);
        const url = `https://${cluster}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
        const res = await this.safeGet(url);
        if (res.status === 404) {
            throw new common_1.NotFoundException();
        }
        if (res.status >= 400) {
            throw new common_1.HttpException(res.data?.status?.message ?? 'Riot API error', res.status);
        }
        const body = res.data;
        const info = body.info;
        return {
            matchId: body.metadata?.matchId ?? matchId,
            gameMode: info.gameMode,
            gameDuration: info.gameDuration,
            gameCreation: info.gameCreation,
            participants: info.participants.map((p) => ({
                puuid: p.puuid,
                championName: p.championName,
                kills: p.kills,
                deaths: p.deaths,
                assists: p.assists,
                win: p.win,
                totalDamageDealt: p.totalDamageDealtToChampions ?? p.totalDamageDealt ?? 0,
            })),
        };
    }
    async getRankedStats(summonerId, region) {
        const host = platformHost(region);
        const url = `https://${host}/lol/league/v4/entries/by-summoner/${summonerId}`;
        const res = await this.safeGet(url);
        if (res.status >= 500 || res.status === 0) {
            throw new common_1.HttpException('Riot API unavailable, please try again later', common_1.HttpStatus.BAD_GATEWAY);
        }
        if (res.status === 404) {
            return [];
        }
        if (res.status !== 200) {
            throw new common_1.HttpException('Riot API unavailable, please try again later', common_1.HttpStatus.BAD_GATEWAY);
        }
        const rows = res.data;
        return rows.map((r) => ({
            queueType: r.queueType,
            tier: r.tier,
            rank: r.rank,
            leaguePoints: r.leaguePoints,
            wins: r.wins,
            losses: r.losses,
            hotStreak: r.hotStreak,
        }));
    }
};
exports.RiotServiceAxios = RiotServiceAxios;
exports.RiotServiceAxios = RiotServiceAxios = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RiotServiceAxios);
//# sourceMappingURL=riot-service-axios.js.map