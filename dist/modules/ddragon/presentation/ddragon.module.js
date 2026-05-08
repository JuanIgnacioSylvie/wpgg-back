"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DdragonModule = void 0;
const cache_manager_1 = require("@nestjs/cache-manager");
const common_1 = require("@nestjs/common");
const shared_module_1 = require("../../../shared/shared.module");
const get_champion_detail_use_case_1 = require("../application/use-cases/get-champion-detail.use-case");
const get_champions_use_case_1 = require("../application/use-cases/get-champions.use-case");
const get_current_version_use_case_1 = require("../application/use-cases/get-current-version.use-case");
const ddragon_service_interface_1 = require("../domain/services/ddragon.service.interface");
const ddragon_service_axios_1 = require("../infrastructure/services/ddragon-service-axios");
const ddragon_controller_1 = require("./ddragon.controller");
let DdragonModule = class DdragonModule {
};
exports.DdragonModule = DdragonModule;
exports.DdragonModule = DdragonModule = __decorate([
    (0, common_1.Module)({
        imports: [
            shared_module_1.SharedModule,
            cache_manager_1.CacheModule.register({
                ttl: 3600000,
            }),
        ],
        controllers: [ddragon_controller_1.DdragonController],
        providers: [
            { provide: ddragon_service_interface_1.DDRAGON_SERVICE, useClass: ddragon_service_axios_1.DdragonServiceAxios },
            get_current_version_use_case_1.GetCurrentVersionUseCase,
            get_champions_use_case_1.GetChampionsUseCase,
            get_champion_detail_use_case_1.GetChampionDetailUseCase,
        ],
    })
], DdragonModule);
//# sourceMappingURL=ddragon.module.js.map