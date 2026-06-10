import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response, Request } from 'express';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '@shared/infrastructure/guards/jwt-auth.guard';
import {
  attachSessionCookies,
  clearSessionCookies,
  REFRESH_TOKEN_COOKIE,
} from '../infrastructure/auth-session-cookies';
import { Throttle } from '@nestjs/throttler';
import { ExchangeRiotSessionCodeUseCase } from '../application/use-cases/exchange-riot-session-code.use-case';
import { LoginUserUseCase } from '../application/use-cases/login-user.use-case';
import { LogoutUserUseCase } from '../application/use-cases/logout-user.use-case';
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token.use-case';
import { RequestPasswordResetUseCase } from '../application/use-cases/request-password-reset.use-case';
import { ResetPasswordUseCase } from '../application/use-cases/reset-password.use-case';
import { ResendEmailVerificationUseCase } from '../application/use-cases/resend-email-verification.use-case';
import { VerifyEmailUseCase } from '../application/use-cases/verify-email.use-case';
import { RegisterUserUseCase } from '../application/use-cases/register-user.use-case';
import { LoginRequestDto } from './dto/login-request.dto';
import { ForgotPasswordRequestDto } from './dto/forgot-password-request.dto';
import { ResetPasswordRequestDto } from './dto/reset-password-request.dto';
import { RefreshRequestDto } from './dto/refresh-request.dto';
import { RegisterRequestDto } from './dto/register-request.dto';
import {
  ResendEmailVerificationRequestDto,
  VerifyEmailRequestDto,
} from './dto/email-verification-request.dto';
import { RiotSessionExchangeRequestDto } from './dto/riot-session-exchange-request.dto';

function clientPlatformFromHeaders(
  platformHeader?: string,
): string | undefined {
  const p = platformHeader?.trim().toLowerCase();
  return p === 'web' || p === 'mobile' ? p : undefined;
}

function remoteIpFromRequest(req: Request): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0]?.trim();
  }
  return req.ip;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUser: RegisterUserUseCase,
    private readonly verifyEmail: VerifyEmailUseCase,
    private readonly resendEmailVerification: ResendEmailVerificationUseCase,
    private readonly loginUser: LoginUserUseCase,
    private readonly refreshToken: RefreshTokenUseCase,
    private readonly logoutUser: LogoutUserUseCase,
    private readonly exchangeRiotSessionCode: ExchangeRiotSessionCodeUseCase,
    private readonly requestPasswordReset: RequestPasswordResetUseCase,
    private readonly resetPassword: ResetPasswordUseCase,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(
    @Body() body: RegisterRequestDto,
    @Headers('x-wpgg-platform') platformHeader: string | undefined,
    @Req() req: Request,
  ) {
    const { riotLinkPendingCode, turnstileToken, ...registerBody } = body;
    const out = await this.registerUser.execute({
      ...registerBody,
      turnstileToken,
      clientPlatform: clientPlatformFromHeaders(platformHeader),
      remoteIp: remoteIpFromRequest(req),
      riotLinkPendingCode,
    });
    return { ok: true, email: out.email };
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async verifyEmailRoute(
    @Body() body: VerifyEmailRequestDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const out = await this.verifyEmail.execute({ token: body.token });
    attachSessionCookies(res, this.configService, {
      accessToken: out.accessToken,
      refreshToken: out.refreshToken,
      rememberMe: out.rememberMe,
    });
    return { accessToken: out.accessToken, refreshToken: out.refreshToken };
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async resendVerification(
    @Body() body: ResendEmailVerificationRequestDto,
    @Headers('x-wpgg-platform') platformHeader: string | undefined,
    @Req() req: Request,
  ) {
    await this.resendEmailVerification.execute({
      email: body.email,
      turnstileToken: body.turnstileToken,
      clientPlatform: clientPlatformFromHeaders(platformHeader),
      remoteIp: remoteIpFromRequest(req),
    });
    return { ok: true };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async login(
    @Body() body: LoginRequestDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const out = await this.loginUser.execute(body);
    attachSessionCookies(res, this.configService, {
      accessToken: out.accessToken,
      refreshToken: out.refreshToken,
      rememberMe: out.rememberMe,
    });
    return { accessToken: out.accessToken, refreshToken: out.refreshToken };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() body: RefreshRequestDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const fromCookie = req.cookies?.[REFRESH_TOKEN_COOKIE];
    const fromBody =
      typeof body.refreshToken === 'string' ? body.refreshToken.trim() : '';
    const raw = (fromCookie && fromCookie.trim()) || fromBody || undefined;
    if (!raw) {
      throw new UnauthorizedException('Unauthorized');
    }
    const out = await this.refreshToken.execute({ refreshToken: raw });
    attachSessionCookies(res, this.configService, {
      accessToken: out.accessToken,
      refreshToken: out.refreshToken,
      rememberMe: out.rememberMe,
    });
    const usedBodyOnly = !fromCookie?.trim() && Boolean(fromBody);
    if (usedBodyOnly) {
      return {
        accessToken: out.accessToken,
        refreshToken: out.refreshToken,
      };
    }
    return { accessToken: out.accessToken };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async forgotPassword(@Body() body: ForgotPasswordRequestDto) {
    await this.requestPasswordReset.execute({ email: body.email });
    return { ok: true };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async resetPasswordRoute(@Body() body: ResetPasswordRequestDto) {
    await this.resetPassword.execute({
      token: body.token,
      password: body.password,
    });
    return { ok: true };
  }

  /**
   * Redeem one-time `riot_session` code from Riot OAuth success redirect.
   * Returns wpgg tokens and sets session cookies when possible.
   */
  @Post('riot-session')
  @HttpCode(HttpStatus.OK)
  async riotSession(
    @Body() body: RiotSessionExchangeRequestDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const out = await this.exchangeRiotSessionCode.execute({
      code: body.code,
    });
    attachSessionCookies(res, this.configService, out);
    return {
      accessToken: out.accessToken,
      refreshToken: out.refreshToken,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser() userId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.logoutUser.execute({
      userId,
      refreshTokenFromCookie: req.cookies?.[REFRESH_TOKEN_COOKIE],
      logoutAll: false,
    });
    clearSessionCookies(res, this.configService);
    return {};
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logoutAll(
    @CurrentUser() userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.logoutUser.execute({
      userId,
      refreshTokenFromCookie: undefined,
      logoutAll: true,
    });
    clearSessionCookies(res, this.configService);
    return {};
  }
}
