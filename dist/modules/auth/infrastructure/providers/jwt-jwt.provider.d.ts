import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { IJwtProvider } from '../../domain/providers/jwt.provider.interface';
export declare class JwtJwtProvider implements IJwtProvider {
    private readonly jwtService;
    private readonly configService;
    constructor(jwtService: JwtService, configService: ConfigService);
    generateAccessToken(userId: string): string;
    generateRefreshToken(userId: string): {
        token: string;
        expiresAt: Date;
    };
    verifyAccessToken(token: string): {
        userId: string;
    } | null;
    verifyRefreshToken(token: string): {
        userId: string;
    } | null;
}
