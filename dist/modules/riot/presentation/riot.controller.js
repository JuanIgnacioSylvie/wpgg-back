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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiotController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../../shared/infrastructure/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../../../shared/infrastructure/guards/jwt-auth.guard");
const get_match_history_use_case_1 = require("../application/use-cases/get-match-history.use-case");
const get_ranked_stats_use_case_1 = require("../application/use-cases/get-ranked-stats.use-case");
const get_summoner_profile_use_case_1 = require("../application/use-cases/get-summoner-profile.use-case");
const link_riot_account_use_case_1 = require("../application/use-cases/link-riot-account.use-case");
const link_riot_account_request_dto_1 = require("./dto/link-riot-account-request.dto");
let RiotController = class RiotController {
    constructor(linkRiot, summonerProfile, matchHistory, rankedStats) {
        this.linkRiot = linkRiot;
        this.summonerProfile = summonerProfile;
        this.matchHistory = matchHistory;
        this.rankedStats = rankedStats;
    }
    async link(userId, body) {
        const account = await this.linkRiot.execute({
            userId,
            gameName: body.gameName,
            tagLine: body.tagLine,
            region: body.region,
        });
        return {
            id: account.id,
            userId: account.userId,
            puuid: account.puuid,
            gameName: account.gameName,
            tagLine: account.tagLine,
            region: account.region,
            summonerId: account.summonerId,
            accountId: account.accountId,
            linkedAt: account.linkedAt,
        };
    }
    async getSummoner(userId) {
        const s = await this.summonerProfile.execute(userId);
        return {
            puuid: s.puuid,
            summonerId: s.summonerId,
            accountId: s.accountId,
            profileIconId: s.profileIconId,
            summonerLevel: s.summonerLevel,
            revisionDate: s.revisionDate,
        };
    }
    async getMatch(userId, matchId) {
        const m = await this.matchHistory.executeMatchDetail(userId, matchId);
        return {
            matchId: m.matchId,
            gameMode: m.gameMode,
            gameDuration: m.gameDuration,
            gameCreation: m.gameCreation,
            participants: m.participants,
        };
    }
    async getMatches(userId) {
        const list = await this.matchHistory.execute(userId);
        return list.map((m) => ({
            matchId: m.matchId,
            gameMode: m.gameMode,
            gameDuration: m.gameDuration,
            gameCreation: m.gameCreation,
            participants: m.participants,
        }));
    }
    async getRanked(userId) {
        const rows = await this.rankedStats.execute(userId);
        return rows.map((r) => ({
            queueType: r.queueType,
            tier: r.tier,
            rank: r.rank,
            leaguePoints: r.leaguePoints,
            wins: r.wins,
            losses: r.losses,
            hotStreak: r.hotStreak,
            winRate: r.getWinRate(),
        }));
    }
};
exports.RiotController = RiotController;
__decorate([
    (0, common_1.Post)('link'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, link_riot_account_request_dto_1.LinkRiotAccountRequestDto]),
    __metadata("design:returntype", Promise)
], RiotController.prototype, "link", null);
__decorate([
    (0, common_1.Get)('summoner'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RiotController.prototype, "getSummoner", null);
__decorate([
    (0, common_1.Get)('matches/:matchId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('matchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RiotController.prototype, "getMatch", null);
__decorate([
    (0, common_1.Get)('matches'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RiotController.prototype, "getMatches", null);
__decorate([
    (0, common_1.Get)('ranked'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RiotController.prototype, "getRanked", null);
exports.RiotController = RiotController = __decorate([
    (0, common_1.Controller)('riot'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [link_riot_account_use_case_1.LinkRiotAccountUseCase,
        get_summoner_profile_use_case_1.GetSummonerProfileUseCase,
        get_match_history_use_case_1.GetMatchHistoryUseCase,
        get_ranked_stats_use_case_1.GetRankedStatsUseCase])
], RiotController);
//# sourceMappingURL=riot.controller.js.map