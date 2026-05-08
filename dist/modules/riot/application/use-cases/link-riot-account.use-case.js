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
exports.LinkRiotAccountUseCase = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const riot_account_entity_1 = require("../../domain/entities/riot-account.entity");
const riot_account_repository_interface_1 = require("../../domain/repositories/riot-account.repository.interface");
const riot_service_interface_1 = require("../../domain/services/riot.service.interface");
let LinkRiotAccountUseCase = class LinkRiotAccountUseCase {
    constructor(riotAccountRepository, riotService) {
        this.riotAccountRepository = riotAccountRepository;
        this.riotService = riotService;
    }
    async execute(input) {
        const existingByUser = await this.riotAccountRepository.findByUserId(input.userId);
        if (existingByUser) {
            throw new common_1.ConflictException('User already has a linked Riot account');
        }
        const account = await this.riotService.getAccountByRiotId(input.gameName, input.tagLine, input.region);
        const existingByPuuid = await this.riotAccountRepository.findByPuuid(account.puuid);
        if (existingByPuuid) {
            throw new common_1.ConflictException('Riot account already linked to another user');
        }
        const summoner = await this.riotService.getSummonerByPuuid(account.puuid, input.region);
        const entity = riot_account_entity_1.RiotAccountEntity.create({
            id: (0, crypto_1.randomUUID)(),
            userId: input.userId,
            puuid: account.puuid,
            gameName: account.gameName,
            tagLine: account.tagLine,
            region: input.region,
            summonerId: summoner.summonerId,
            accountId: summoner.accountId,
        });
        return this.riotAccountRepository.save(entity);
    }
};
exports.LinkRiotAccountUseCase = LinkRiotAccountUseCase;
exports.LinkRiotAccountUseCase = LinkRiotAccountUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(riot_account_repository_interface_1.RIOT_ACCOUNT_REPOSITORY)),
    __param(1, (0, common_1.Inject)(riot_service_interface_1.RIOT_SERVICE)),
    __metadata("design:paramtypes", [Object, Object])
], LinkRiotAccountUseCase);
//# sourceMappingURL=link-riot-account.use-case.js.map