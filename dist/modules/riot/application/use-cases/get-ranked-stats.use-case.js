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
exports.GetRankedStatsUseCase = void 0;
const common_1 = require("@nestjs/common");
const ranked_entry_entity_1 = require("../../domain/entities/ranked-entry.entity");
const riot_account_repository_interface_1 = require("../../domain/repositories/riot-account.repository.interface");
const riot_service_interface_1 = require("../../domain/services/riot.service.interface");
let GetRankedStatsUseCase = class GetRankedStatsUseCase {
    constructor(riotAccountRepository, riotService) {
        this.riotAccountRepository = riotAccountRepository;
        this.riotService = riotService;
    }
    async execute(userId) {
        const account = await this.riotAccountRepository.findByUserId(userId);
        if (!account) {
            throw new common_1.ForbiddenException();
        }
        try {
            const rows = await this.riotService.getRankedStats(account.summonerId, account.region);
            return rows.map((r) => new ranked_entry_entity_1.RankedEntryEntity(r.queueType, r.tier, r.rank, r.leaguePoints, r.wins, r.losses, r.hotStreak));
        }
        catch (err) {
            if (err instanceof common_1.HttpException) {
                throw err;
            }
            throw new common_1.HttpException('Riot API unavailable, please try again later', common_1.HttpStatus.BAD_GATEWAY);
        }
    }
};
exports.GetRankedStatsUseCase = GetRankedStatsUseCase;
exports.GetRankedStatsUseCase = GetRankedStatsUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(riot_account_repository_interface_1.RIOT_ACCOUNT_REPOSITORY)),
    __param(1, (0, common_1.Inject)(riot_service_interface_1.RIOT_SERVICE)),
    __metadata("design:paramtypes", [Object, Object])
], GetRankedStatsUseCase);
//# sourceMappingURL=get-ranked-stats.use-case.js.map