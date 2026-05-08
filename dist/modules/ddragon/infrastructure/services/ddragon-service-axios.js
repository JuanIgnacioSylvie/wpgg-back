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
exports.DdragonServiceAxios = void 0;
const cache_manager_1 = require("@nestjs/cache-manager");
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
const champion_entity_1 = require("../../domain/entities/champion.entity");
const VERSIONS_URL = 'https://ddragon.leagueoflegends.com/api/versions.json';
const TTL_MS = 3_600_000;
function mapChampion(version, c) {
    const imageUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${c.image.full}`;
    return new champion_entity_1.ChampionEntity(c.id, c.key, c.name, c.title, c.blurb, c.tags, {
        hp: c.stats.hp,
        armor: c.stats.armor,
        spellblock: c.stats.spellblock,
        attackdamage: c.stats.attackdamage,
        attackspeed: c.stats.attackspeed,
        movespeed: c.stats.movespeed,
    }, imageUrl);
}
let DdragonServiceAxios = class DdragonServiceAxios {
    constructor(cache) {
        this.cache = cache;
    }
    async getCurrentVersion() {
        const key = 'ddragon:version';
        const hit = await this.cache.get(key);
        if (hit !== undefined && hit !== null) {
            return hit;
        }
        try {
            const { data } = await axios_1.default.get(VERSIONS_URL, {
                timeout: 5000,
            });
            const v = data[0];
            if (!v) {
                throw new Error('empty version list');
            }
            await this.cache.set(key, v, TTL_MS);
            return v;
        }
        catch {
            throw new common_1.HttpException('DDragon unavailable', common_1.HttpStatus.BAD_GATEWAY);
        }
    }
    async getChampions(version) {
        const key = `ddragon:champions:${version}`;
        const hit = await this.cache.get(key);
        if (hit !== undefined && hit !== null) {
            return hit;
        }
        const url = `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`;
        try {
            const { data } = await axios_1.default.get(url, { timeout: 5000 });
            const list = Object.values(data.data).map((c) => mapChampion(version, c));
            await this.cache.set(key, list, TTL_MS);
            return list;
        }
        catch {
            throw new common_1.HttpException('DDragon unavailable', common_1.HttpStatus.BAD_GATEWAY);
        }
    }
    async getChampionDetail(version, championName) {
        const normalized = championName.trim().toLowerCase();
        const champions = await this.getChampions(version);
        const found = champions.find((c) => c.name.toLowerCase() === normalized ||
            c.id.toLowerCase() === normalized);
        if (!found) {
            throw new common_1.NotFoundException('Champion not found');
        }
        return found;
    }
};
exports.DdragonServiceAxios = DdragonServiceAxios;
exports.DdragonServiceAxios = DdragonServiceAxios = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [Object])
], DdragonServiceAxios);
//# sourceMappingURL=ddragon-service-axios.js.map