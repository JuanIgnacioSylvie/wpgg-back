"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserMapper = void 0;
const user_entity_1 = require("../../../domain/entities/user.entity");
class UserMapper {
    static toDomain(row) {
        return new user_entity_1.UserEntity(row.id, row.email, row.passwordHash, row.createdAt, row.updatedAt);
    }
    static toPrisma(entity) {
        return {
            id: entity.id,
            email: entity.email,
            passwordHash: entity.passwordHash,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}
exports.UserMapper = UserMapper;
//# sourceMappingURL=user.mapper.js.map