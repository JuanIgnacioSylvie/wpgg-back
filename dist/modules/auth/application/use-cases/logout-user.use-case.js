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
exports.LogoutUserUseCase = void 0;
const common_1 = require("@nestjs/common");
const refresh_token_lookup_1 = require("../refresh-token-lookup");
const hash_provider_interface_1 = require("../../domain/providers/hash.provider.interface");
const refresh_token_repository_interface_1 = require("../../domain/repositories/refresh-token.repository.interface");
let LogoutUserUseCase = class LogoutUserUseCase {
    constructor(refreshTokenRepository, hashProvider) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.hashProvider = hashProvider;
    }
    async execute(input) {
        if (input.logoutAll) {
            try {
                await this.refreshTokenRepository.revokeAllForUser(input.userId);
            }
            catch {
                throw new common_1.InternalServerErrorException();
            }
            return;
        }
        const cookie = input.refreshTokenFromCookie;
        if (!cookie) {
            return;
        }
        const candidates = await this.refreshTokenRepository.listByUserId(input.userId);
        const matched = await (0, refresh_token_lookup_1.findRefreshTokenByPlain)(cookie, candidates, this.hashProvider);
        if (!matched || matched.userId !== input.userId) {
            return;
        }
        try {
            await this.refreshTokenRepository.revoke(matched.id);
        }
        catch {
            throw new common_1.InternalServerErrorException();
        }
    }
};
exports.LogoutUserUseCase = LogoutUserUseCase;
exports.LogoutUserUseCase = LogoutUserUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(refresh_token_repository_interface_1.REFRESH_TOKEN_REPOSITORY)),
    __param(1, (0, common_1.Inject)(hash_provider_interface_1.HASH_PROVIDER)),
    __metadata("design:paramtypes", [Object, Object])
], LogoutUserUseCase);
//# sourceMappingURL=logout-user.use-case.js.map