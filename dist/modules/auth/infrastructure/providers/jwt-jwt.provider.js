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
exports.JwtJwtProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
let JwtJwtProvider = class JwtJwtProvider {
    constructor(jwtService, configService) {
        this.jwtService = jwtService;
        this.configService = configService;
    }
    generateAccessToken(userId) {
        return this.jwtService.sign({ type: 'access' }, {
            subject: userId,
            expiresIn: this.configService.get('JWT_ACCESS_EXPIRY'),
        });
    }
    generateRefreshToken(userId) {
        const expiresIn = this.configService.get('JWT_REFRESH_EXPIRY');
        const token = this.jwtService.sign({ type: 'refresh' }, {
            subject: userId,
            expiresIn,
        });
        const decoded = this.jwtService.decode(token);
        const expiresAt = new Date((decoded.exp ?? 0) * 1000);
        return { token, expiresAt };
    }
    verifyAccessToken(token) {
        try {
            const payload = this.jwtService.verify(token);
            if (payload.type !== 'access' || !payload.sub) {
                return null;
            }
            return { userId: payload.sub };
        }
        catch {
            return null;
        }
    }
    verifyRefreshToken(token) {
        try {
            const payload = this.jwtService.verify(token);
            if (payload.type !== 'refresh' || !payload.sub) {
                return null;
            }
            return { userId: payload.sub };
        }
        catch {
            return null;
        }
    }
};
exports.JwtJwtProvider = JwtJwtProvider;
exports.JwtJwtProvider = JwtJwtProvider = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService])
], JwtJwtProvider);
//# sourceMappingURL=jwt-jwt.provider.js.map