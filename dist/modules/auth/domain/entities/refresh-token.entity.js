"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenEntity = void 0;
class RefreshTokenEntity {
    constructor(id, tokenHash, userId, expiresAt, createdAt, revoked) {
        this.id = id;
        this.tokenHash = tokenHash;
        this.userId = userId;
        this.expiresAt = expiresAt;
        this.createdAt = createdAt;
        this.revoked = revoked;
    }
    static create(props) {
        if (!props.id || !props.tokenHash || !props.userId || !props.expiresAt) {
            throw new Error('RefreshTokenEntity.create: all fields (id, tokenHash, userId, expiresAt) are required');
        }
        return new RefreshTokenEntity(props.id, props.tokenHash, props.userId, props.expiresAt, new Date(), false);
    }
    isExpired() {
        return new Date() > this.expiresAt;
    }
    isValid() {
        return !this.revoked && !this.isExpired();
    }
}
exports.RefreshTokenEntity = RefreshTokenEntity;
//# sourceMappingURL=refresh-token.entity.js.map