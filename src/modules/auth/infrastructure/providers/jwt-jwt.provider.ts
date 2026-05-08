import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { IJwtProvider } from '../../domain/providers/jwt.provider.interface';

interface JwtPayload {
  sub: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtJwtProvider implements IJwtProvider {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generateAccessToken(userId: string): string {
    return this.jwtService.sign(
      { type: 'access' as const },
      {
        subject: userId,
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRY'),
      },
    );
  }

  generateRefreshToken(userId: string): { token: string; expiresAt: Date } {
    const expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRY')!;
    const token = this.jwtService.sign(
      { type: 'refresh' as const },
      {
        subject: userId,
        expiresIn,
      },
    );
    const decoded = this.jwtService.decode(token) as JwtPayload;
    const expiresAt = new Date((decoded.exp ?? 0) * 1000);
    return { token, expiresAt };
  }

  verifyAccessToken(token: string): { userId: string } | null {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      if (payload.type !== 'access' || !payload.sub) {
        return null;
      }
      return { userId: payload.sub };
    } catch {
      return null;
    }
  }

  verifyRefreshToken(token: string): { userId: string } | null {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      if (payload.type !== 'refresh' || !payload.sub) {
        return null;
      }
      return { userId: payload.sub };
    } catch {
      return null;
    }
  }
}
