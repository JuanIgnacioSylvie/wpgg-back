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
exports.PrismaUserRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../shared/infrastructure/prisma/prisma.service");
const user_mapper_1 = require("./mappers/user.mapper");
let PrismaUserRepository = class PrismaUserRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        const row = await this.prisma.user.findUnique({ where: { id } });
        return row ? user_mapper_1.UserMapper.toDomain(row) : null;
    }
    async findByEmail(email) {
        const row = await this.prisma.user.findUnique({ where: { email } });
        return row ? user_mapper_1.UserMapper.toDomain(row) : null;
    }
    async save(user) {
        const row = await this.prisma.user.upsert({
            where: { id: user.id },
            create: user_mapper_1.UserMapper.toPrisma(user),
            update: {
                email: user.email,
                passwordHash: user.passwordHash,
                updatedAt: user.updatedAt,
            },
        });
        return user_mapper_1.UserMapper.toDomain(row);
    }
    async existsByEmail(email) {
        const n = await this.prisma.user.count({ where: { email } });
        return n > 0;
    }
};
exports.PrismaUserRepository = PrismaUserRepository;
exports.PrismaUserRepository = PrismaUserRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaUserRepository);
//# sourceMappingURL=prisma-user.repository.js.map