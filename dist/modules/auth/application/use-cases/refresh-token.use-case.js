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
exports.RefreshTokenUseCase = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const refresh_token_lookup_1 = require("../refresh-token-lookup");
const refresh_token_entity_1 = require("../../domain/entities/refresh-token.entity");
const hash_provider_interface_1 = require("../../domain/providers/hash.provider.interface");
const jwt_provider_interface_1 = require("../../domain/providers/jwt.provider.interface");
const refresh_token_repository_interface_1 = require("../../domain/repositories/refresh-token.repository.interface");
let RefreshTokenUseCase = class RefreshTokenUseCase {
    constructor(refreshTokenRepository, hashProvider, jwtProvider) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.hashProvider = hashProvider;
        this.jwtProvider = jwtProvider;
    }
    async execute(input) {
        const claims = this.jwtProvider.verifyRefreshToken(input.refreshToken);
        if (!claims) {
            throw new common_1.UnauthorizedException('Unauthorized');
        }
        const candidates = await this.refreshTokenRepository.listByUserId(claims.userId);
        const matched = await (0, refresh_token_lookup_1.findRefreshTokenByPlain)(input.refreshToken, candidates, this.hashProvider);
        if (!matched) {
            throw new common_1.UnauthorizedException('Unauthorized');
        }
        if (matched.revoked) {
            await this.refreshTokenRepository.revokeAllForUser(matched.userId);
            throw new common_1.UnauthorizedException('Unauthorized');
        }
        if (!matched.isValid()) {
            throw new common_1.UnauthorizedException('Unauthorized');
        }
        const accessToken = this.jwtProvider.generateAccessToken(matched.userId);
        const { token: newRawRefresh, expiresAt } = this.jwtProvider.generateRefreshToken(matched.userId);
        const tokenHash = await this.hashProvider.hash(newRawRefresh);
        const newEntity = refresh_token_entity_1.RefreshTokenEntity.create({
            id: (0, crypto_1.randomUUID)(),
            tokenHash,
            userId: matched.userId,
            expiresAt,
        });
        try {
            await this.refreshTokenRepository.save(newEntity);
        }
        catch {
            throw new common_1.InternalServerErrorException();
        }
        try {
            await this.refreshTokenRepository.revoke(matched.id);
        }
        catch {
            throw new common_1.InternalServerErrorException();
        }
        return { accessToken, refreshToken: newRawRefresh };
    }
};
exports.RefreshTokenUseCase = RefreshTokenUseCase;
exports.RefreshTokenUseCase = RefreshTokenUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(refresh_token_repository_interface_1.REFRESH_TOKEN_REPOSITORY)),
    __param(1, (0, common_1.Inject)(hash_provider_interface_1.HASH_PROVIDER)),
    __param(2, (0, common_1.Inject)(jwt_provider_interface_1.JWT_PROVIDER)),
    __metadata("design:paramtypes", [Object, Object, Object])
], RefreshTokenUseCase);
//# sourceMappingURL=refresh-token.use-case.js.map