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
exports.JwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const jwt_provider_interface_1 = require("../../../modules/auth/domain/providers/jwt.provider.interface");
let JwtAuthGuard = class JwtAuthGuard {
    constructor(jwtProvider) {
        this.jwtProvider = jwtProvider;
    }
    canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const header = req.headers.authorization;
        if (!header?.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('Unauthorized');
        }
        const token = header.slice(7);
        const payload = this.jwtProvider.verifyAccessToken(token);
        if (!payload) {
            throw new common_1.UnauthorizedException('Unauthorized');
        }
        req.user = {
            userId: payload.userId,
        };
        return true;
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(jwt_provider_interface_1.JWT_PROVIDER)),
    __metadata("design:paramtypes", [Object])
], JwtAuthGuard);
//# sourceMappingURL=jwt-auth.guard.js.map