"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiotModule = void 0;
const common_1 = require("@nestjs/common");
const shared_module_1 = require("../../../shared/shared.module");
const auth_module_1 = require("../../auth/presentation/auth.module");
const link_riot_account_use_case_1 = require("../application/use-cases/link-riot-account.use-case");
const get_summoner_profile_use_case_1 = require("../application/use-cases/get-summoner-profile.use-case");
const get_match_history_use_case_1 = require("../application/use-cases/get-match-history.use-case");
const get_ranked_stats_use_case_1 = require("../application/use-cases/get-ranked-stats.use-case");
const riot_account_repository_interface_1 = require("../domain/repositories/riot-account.repository.interface");
const riot_service_interface_1 = require("../domain/services/riot.service.interface");
const prisma_riot_account_repository_1 = require("../infrastructure/persistence/prisma-riot-account.repository");
const riot_service_axios_1 = require("../infrastructure/services/riot-service-axios");
const riot_controller_1 = require("./riot.controller");
let RiotModule = class RiotModule {
};
exports.RiotModule = RiotModule;
exports.RiotModule = RiotModule = __decorate([
    (0, common_1.Module)({
        imports: [shared_module_1.SharedModule, auth_module_1.AuthModule],
        controllers: [riot_controller_1.RiotController],
        providers: [
            { provide: riot_account_repository_interface_1.RIOT_ACCOUNT_REPOSITORY, useClass: prisma_riot_account_repository_1.PrismaRiotAccountRepository },
            { provide: riot_service_interface_1.RIOT_SERVICE, useClass: riot_service_axios_1.RiotServiceAxios },
            link_riot_account_use_case_1.LinkRiotAccountUseCase,
            get_summoner_profile_use_case_1.GetSummonerProfileUseCase,
            get_match_history_use_case_1.GetMatchHistoryUseCase,
            get_ranked_stats_use_case_1.GetRankedStatsUseCase,
        ],
    })
], RiotModule);
//# sourceMappingURL=riot.module.js.map