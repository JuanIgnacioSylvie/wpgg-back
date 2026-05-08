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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const current_user_decorator_1 = require("../../../shared/infrastructure/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../../../shared/infrastructure/guards/jwt-auth.guard");
const login_user_use_case_1 = require("../application/use-cases/login-user.use-case");
const logout_user_use_case_1 = require("../application/use-cases/logout-user.use-case");
const refresh_token_use_case_1 = require("../application/use-cases/refresh-token.use-case");
const register_user_use_case_1 = require("../application/use-cases/register-user.use-case");
const login_request_dto_1 = require("./dto/login-request.dto");
const register_request_dto_1 = require("./dto/register-request.dto");
const REFRESH_COOKIE = 'refreshToken';
let AuthController = class AuthController {
    constructor(registerUser, loginUser, refreshToken, logoutUser, configService) {
        this.registerUser = registerUser;
        this.loginUser = loginUser;
        this.refreshToken = refreshToken;
        this.logoutUser = logoutUser;
        this.configService = configService;
    }
    refreshCookieOptions() {
        const secure = this.configService.get('NODE_ENV') === 'production';
        return {
            httpOnly: true,
            secure,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/',
        };
    }
    setRefreshCookie(res, token) {
        res.cookie(REFRESH_COOKIE, token, this.refreshCookieOptions());
    }
    async register(body, res) {
        const out = await this.registerUser.execute(body);
        this.setRefreshCookie(res, out.refreshToken);
        return { accessToken: out.accessToken };
    }
    async login(body, res) {
        const out = await this.loginUser.execute(body);
        this.setRefreshCookie(res, out.refreshToken);
        return { accessToken: out.accessToken };
    }
    async refresh(req, res) {
        const raw = req.cookies?.[REFRESH_COOKIE];
        if (!raw) {
            throw new common_1.UnauthorizedException('Unauthorized');
        }
        const out = await this.refreshToken.execute({ refreshToken: raw });
        this.setRefreshCookie(res, out.refreshToken);
        return { accessToken: out.accessToken };
    }
    async logout(userId, req, res) {
        await this.logoutUser.execute({
            userId,
            refreshTokenFromCookie: req.cookies?.[REFRESH_COOKIE],
            logoutAll: false,
        });
        res.clearCookie(REFRESH_COOKIE, this.refreshCookieOptions());
        return {};
    }
    async logoutAll(userId, res) {
        await this.logoutUser.execute({
            userId,
            refreshTokenFromCookie: undefined,
            logoutAll: true,
        });
        res.clearCookie(REFRESH_COOKIE, this.refreshCookieOptions());
        return {};
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_request_dto_1.RegisterRequestDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_request_dto_1.LoginRequestDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)('logout-all'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logoutAll", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [register_user_use_case_1.RegisterUserUseCase,
        login_user_use_case_1.LoginUserUseCase,
        refresh_token_use_case_1.RefreshTokenUseCase,
        logout_user_use_case_1.LogoutUserUseCase,
        config_1.ConfigService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map