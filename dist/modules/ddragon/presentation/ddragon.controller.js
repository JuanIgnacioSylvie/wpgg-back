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
exports.DdragonController = void 0;
const common_1 = require("@nestjs/common");
const get_champion_detail_use_case_1 = require("../application/use-cases/get-champion-detail.use-case");
const get_champions_use_case_1 = require("../application/use-cases/get-champions.use-case");
const get_current_version_use_case_1 = require("../application/use-cases/get-current-version.use-case");
let DdragonController = class DdragonController {
    constructor(currentVersion, champions, championDetail) {
        this.currentVersion = currentVersion;
        this.champions = champions;
        this.championDetail = championDetail;
    }
    async version() {
        const version = await this.currentVersion.execute();
        return { version };
    }
    async listChampions() {
        const list = await this.champions.execute();
        return list.map((c) => ({
            id: c.id,
            key: c.key,
            name: c.name,
            title: c.title,
            blurb: c.blurb,
            tags: c.tags,
            stats: c.stats,
            imageUrl: c.imageUrl,
        }));
    }
    async getChampion(name) {
        const c = await this.championDetail.execute(decodeURIComponent(name));
        return {
            id: c.id,
            key: c.key,
            name: c.name,
            title: c.title,
            blurb: c.blurb,
            tags: c.tags,
            stats: c.stats,
            imageUrl: c.imageUrl,
        };
    }
};
exports.DdragonController = DdragonController;
__decorate([
    (0, common_1.Get)('version'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DdragonController.prototype, "version", null);
__decorate([
    (0, common_1.Get)('champions'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DdragonController.prototype, "listChampions", null);
__decorate([
    (0, common_1.Get)('champions/:name'),
    __param(0, (0, common_1.Param)('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DdragonController.prototype, "getChampion", null);
exports.DdragonController = DdragonController = __decorate([
    (0, common_1.Controller)('ddragon'),
    __metadata("design:paramtypes", [get_current_version_use_case_1.GetCurrentVersionUseCase,
        get_champions_use_case_1.GetChampionsUseCase,
        get_champion_detail_use_case_1.GetChampionDetailUseCase])
], DdragonController);
//# sourceMappingURL=ddragon.controller.js.map