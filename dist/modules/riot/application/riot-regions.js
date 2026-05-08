"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALLOWED_RIOT_REGIONS = void 0;
exports.isAllowedRiotRegion = isAllowedRiotRegion;
exports.ALLOWED_RIOT_REGIONS = [
    'EUW1',
    'NA1',
    'KR',
    'BR1',
    'EUN1',
    'JP1',
    'LA1',
    'LA2',
    'OC1',
    'TR1',
    'RU',
    'PH2',
    'SG2',
    'TH2',
    'TW2',
    'VN2',
];
function isAllowedRiotRegion(r) {
    return exports.ALLOWED_RIOT_REGIONS.includes(r);
}
//# sourceMappingURL=riot-regions.js.map