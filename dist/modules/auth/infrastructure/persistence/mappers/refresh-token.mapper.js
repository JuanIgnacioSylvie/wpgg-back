"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenMapper = void 0;
const refresh_token_entity_1 = require("../../../domain/entities/refresh-token.entity");
class RefreshTokenMapper {
    static toDomain(row) {
        return new refresh_token_entity_1.RefreshTokenEntity(row.id, row.tokenHash, row.userId, row.expiresAt, row.createdAt, row.revoked);
    }
    static toPrisma(entity) {
        return {
            id: entity.id,
            tokenHash: entity.tokenHash,
            userId: entity.userId,
            expiresAt: entity.expiresAt,
            createdAt: entity.createdAt,
            revoked: entity.revoked,
        };
    }
}
exports.RefreshTokenMapper = RefreshTokenMapper;
//# sourceMappingURL=refresh-token.mapper.js.map