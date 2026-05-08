"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const jwt_auth_guard_1 = require("../../../shared/infrastructure/guards/jwt-auth.guard");
const shared_module_1 = require("../../../shared/shared.module");
const register_user_use_case_1 = require("../application/use-cases/register-user.use-case");
const login_user_use_case_1 = require("../application/use-cases/login-user.use-case");
const refresh_token_use_case_1 = require("../application/use-cases/refresh-token.use-case");
const logout_user_use_case_1 = require("../application/use-cases/logout-user.use-case");
const user_repository_interface_1 = require("../domain/repositories/user.repository.interface");
const refresh_token_repository_interface_1 = require("../domain/repositories/refresh-token.repository.interface");
const hash_provider_interface_1 = require("../domain/providers/hash.provider.interface");
const jwt_provider_interface_1 = require("../domain/providers/jwt.provider.interface");
const prisma_user_repository_1 = require("../infrastructure/persistence/prisma-user.repository");
const prisma_refresh_token_repository_1 = require("../infrastructure/persistence/prisma-refresh-token.repository");
const bcrypt_hash_provider_1 = require("../infrastructure/providers/bcrypt-hash.provider");
const jwt_jwt_provider_1 = require("../infrastructure/providers/jwt-jwt.provider");
const auth_controller_1 = require("./auth.controller");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            shared_module_1.SharedModule,
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: (config) => ({
                    secret: config.get('JWT_SECRET'),
                }),
                inject: [config_1.ConfigService],
            }),
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [
            { provide: user_repository_interface_1.USER_REPOSITORY, useClass: prisma_user_repository_1.PrismaUserRepository },
            {
                provide: refresh_token_repository_interface_1.REFRESH_TOKEN_REPOSITORY,
                useClass: prisma_refresh_token_repository_1.PrismaRefreshTokenRepository,
            },
            { provide: hash_provider_interface_1.HASH_PROVIDER, useClass: bcrypt_hash_provider_1.BcryptHashProvider },
            { provide: jwt_provider_interface_1.JWT_PROVIDER, useClass: jwt_jwt_provider_1.JwtJwtProvider },
            jwt_auth_guard_1.JwtAuthGuard,
            register_user_use_case_1.RegisterUserUseCase,
            login_user_use_case_1.LoginUserUseCase,
            refresh_token_use_case_1.RefreshTokenUseCase,
            logout_user_use_case_1.LogoutUserUseCase,
        ],
        exports: [jwt_provider_interface_1.JWT_PROVIDER, jwt_auth_guard_1.JwtAuthGuard],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map