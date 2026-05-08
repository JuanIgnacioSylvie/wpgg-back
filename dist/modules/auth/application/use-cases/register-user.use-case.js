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
exports.RegisterUserUseCase = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const refresh_token_entity_1 = require("../../domain/entities/refresh-token.entity");
const user_entity_1 = require("../../domain/entities/user.entity");
const hash_provider_interface_1 = require("../../domain/providers/hash.provider.interface");
const jwt_provider_interface_1 = require("../../domain/providers/jwt.provider.interface");
const refresh_token_repository_interface_1 = require("../../domain/repositories/refresh-token.repository.interface");
const user_repository_interface_1 = require("../../domain/repositories/user.repository.interface");
let RegisterUserUseCase = class RegisterUserUseCase {
    constructor(userRepository, refreshTokenRepository, hashProvider, jwtProvider) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.hashProvider = hashProvider;
        this.jwtProvider = jwtProvider;
    }
    async execute(input) {
        const emailExists = await this.userRepository.existsByEmail(input.email);
        if (emailExists) {
            throw new common_1.ConflictException('Email already registered');
        }
        const passwordHash = await this.hashProvider.hash(input.password);
        const userId = (0, crypto_1.randomUUID)();
        const user = user_entity_1.UserEntity.create({
            id: userId,
            email: input.email,
            passwordHash,
        });
        let savedUser;
        try {
            savedUser = await this.userRepository.save(user);
        }
        catch {
            throw new common_1.InternalServerErrorException();
        }
        const accessToken = this.jwtProvider.generateAccessToken(savedUser.id);
        const { token: rawRefreshToken, expiresAt } = this.jwtProvider.generateRefreshToken(savedUser.id);
        const tokenHash = await this.hashProvider.hash(rawRefreshToken);
        const refreshEntity = refresh_token_entity_1.RefreshTokenEntity.create({
            id: (0, crypto_1.randomUUID)(),
            tokenHash,
            userId: savedUser.id,
            expiresAt,
        });
        try {
            await this.refreshTokenRepository.save(refreshEntity);
        }
        catch {
            throw new common_1.InternalServerErrorException();
        }
        return { accessToken, refreshToken: rawRefreshToken };
    }
};
exports.RegisterUserUseCase = RegisterUserUseCase;
exports.RegisterUserUseCase = RegisterUserUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(user_repository_interface_1.USER_REPOSITORY)),
    __param(1, (0, common_1.Inject)(refresh_token_repository_interface_1.REFRESH_TOKEN_REPOSITORY)),
    __param(2, (0, common_1.Inject)(hash_provider_interface_1.HASH_PROVIDER)),
    __param(3, (0, common_1.Inject)(jwt_provider_interface_1.JWT_PROVIDER)),
    __metadata("design:paramtypes", [Object, Object, Object, Object])
], RegisterUserUseCase);
//# sourceMappingURL=register-user.use-case.js.map