"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserEntity = void 0;
class UserEntity {
    constructor(id, email, passwordHash, createdAt, updatedAt) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    static create(props) {
        const now = new Date();
        return new UserEntity(props.id, props.email, props.passwordHash, now, now);
    }
    isValidEmail() {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
    }
}
exports.UserEntity = UserEntity;
//# sourceMappingURL=user.entity.js.map