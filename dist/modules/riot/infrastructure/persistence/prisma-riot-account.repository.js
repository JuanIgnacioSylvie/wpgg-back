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
exports.PrismaRiotAccountRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../shared/infrastructure/prisma/prisma.service");
const riot_account_mapper_1 = require("./mappers/riot-account.mapper");
let PrismaRiotAccountRepository = class PrismaRiotAccountRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByUserId(userId) {
        const row = await this.prisma.riotAccount.findUnique({
            where: { userId },
        });
        return row ? riot_account_mapper_1.RiotAccountMapper.toDomain(row) : null;
    }
    async findByPuuid(puuid) {
        const row = await this.prisma.riotAccount.findUnique({
            where: { puuid },
        });
        return row ? riot_account_mapper_1.RiotAccountMapper.toDomain(row) : null;
    }
    async save(account) {
        const row = await this.prisma.riotAccount.create({
            data: riot_account_mapper_1.RiotAccountMapper.toPrisma(account),
        });
        return riot_account_mapper_1.RiotAccountMapper.toDomain(row);
    }
};
exports.PrismaRiotAccountRepository = PrismaRiotAccountRepository;
exports.PrismaRiotAccountRepository = PrismaRiotAccountRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaRiotAccountRepository);
//# sourceMappingURL=prisma-riot-account.repository.js.map