"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiotAccountMapper = void 0;
const riot_account_entity_1 = require("../../../domain/entities/riot-account.entity");
class RiotAccountMapper {
    static toDomain(row) {
        return new riot_account_entity_1.RiotAccountEntity(row.id, row.userId, row.puuid, row.gameName, row.tagLine, row.region, row.summonerId, row.accountId, row.linkedAt);
    }
    static toPrisma(entity) {
        return {
            id: entity.id,
            userId: entity.userId,
            puuid: entity.puuid,
            gameName: entity.gameName,
            tagLine: entity.tagLine,
            region: entity.region,
            summonerId: entity.summonerId,
            accountId: entity.accountId,
            linkedAt: entity.linkedAt,
        };
    }
}
exports.RiotAccountMapper = RiotAccountMapper;
//# sourceMappingURL=riot-account.mapper.js.map