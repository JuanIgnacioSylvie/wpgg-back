import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  GenerateRefreshTokenOptions,
  IJwtProvider,
} from '../../domain/providers/jwt.provider.interface';

const REFRESH_EXPIRES_SHORT = '1d';
const REFRESH_EXPIRES_LONG = '30d';

interface JwtPayload {
  sub: string;
  type: 'access' | 'refresh';
  /** Long session ("remember me"); omitted/false = short session */
  rm?: boolean;
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

  generateRefreshToken(
    userId: string,
    options: GenerateRefreshTokenOptions,
  ): { token: string; expiresAt: Date } {
    const rememberMe = options.rememberMe === true;
    const expiresIn = rememberMe ? REFRESH_EXPIRES_LONG : REFRESH_EXPIRES_SHORT;
    const token = this.jwtService.sign(
      { type: 'refresh' as const, rm: rememberMe },
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

  verifyRefreshToken(
    token: string,
  ): { userId: string; rememberMe: boolean } | null {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      if (payload.type !== 'refresh' || !payload.sub) {
        return null;
      }
      return { userId: payload.sub, rememberMe: payload.rm === true };
    } catch {
      return null;
    }
  }
}
