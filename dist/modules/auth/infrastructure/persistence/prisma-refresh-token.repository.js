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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaRefreshTokenRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../shared/infrastructure/prisma/prisma.service");
const refresh_token_mapper_1 = require("./mappers/refresh-token.mapper");
let PrismaRefreshTokenRepository = class PrismaRefreshTokenRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async save(token) {
        const row = await this.prisma.refreshToken.create({
            data: refresh_token_mapper_1.RefreshTokenMapper.toPrisma(token),
        });
        return refresh_token_mapper_1.RefreshTokenMapper.toDomain(row);
    }
    async findByHash(tokenHash) {
        const row = await this.prisma.refreshToken.findUnique({
            where: { tokenHash },
        });
        return row ? refresh_token_mapper_1.RefreshTokenMapper.toDomain(row) : null;
    }
    async revoke(tokenId) {
        await this.prisma.refreshToken.update({
            where: { id: tokenId },
            data: { revoked: true },
        });
    }
    async revokeAllForUser(userId) {
        await this.prisma.refreshToken.updateMany({
            where: { userId },
            data: { revoked: true },
        });
    }
    async listByUserId(userId) {
        const rows = await this.prisma.refreshToken.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        return rows.map((r) => refresh_token_mapper_1.RefreshTokenMapper.toDomain(r));
    }
    async enforceMaxActiveTokensForUser(userId, maxActive) {
        const now = new Date();
        for (;;) {
            const active = await this.prisma.refreshToken.findMany({
                where: {
                    userId,
                    revoked: false,
                    expiresAt: { gt: now },
                },
                orderBy: { createdAt: 'asc' },
            });
            if (active.length < maxActive) {
                break;
            }
            await this.prisma.refreshToken.update({
                where: { id: active[0].id },
                data: { revoked: true },
            });
        }
    }
};
exports.PrismaRefreshTokenRepository = PrismaRefreshTokenRepository;
exports.PrismaRefreshTokenRepository = PrismaRefreshTokenRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaRefreshTokenRepository);
//# sourceMappingURL=prisma-refresh-token.repository.js.map