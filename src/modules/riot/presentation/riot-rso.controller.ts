import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Body,
  Query,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { attachSessionCookies } from '@modules/auth/infrastructure/auth-session-cookies';
import { EstablishRiotOauthSessionUseCase } from '@modules/auth/application/use-cases/establish-riot-oauth-session.use-case';
import type { Response } from 'express';
import { ExchangeRsoCodeUseCase } from '../application/use-cases/exchange-rso-code.use-case';
import { GetRsoAuthorizeUrlUseCase } from '../application/use-cases/get-rso-authorize-url.use-case';
import { GetRsoUserinfoUseCase } from '../application/use-cases/get-rso-userinfo.use-case';
import { RefreshRsoTokensUseCase } from '../application/use-cases/refresh-rso-tokens.use-case';
import { RsoRefreshRequestDto } from './dto/rso-refresh-request.dto';
import { RsoSignInQueryDto } from './dto/rso-sign-in-query.dto';
import { RsoUserinfoRequestDto } from './dto/rso-userinfo-request.dto';

/**
 * Riot Sign On (OAuth2 / OIDC) — public routes for authorization code flow.
 * Configure RIOT_RSO_CLIENT_ID, RIOT_RSO_REDIRECT_URI, and either
 * RIOT_RSO_CLIENT_SECRET or RIOT_RSO_CLIENT_ASSERTION.
 * Optional: RIOT_RSO_SUCCESS_REDIRECT_URL — after login, issues wpgg cookies and redirects
 * there without putting tokens in the URL fragment.
 */
@Controller('riot/rso')
export class RiotRsoController {
  constructor(
    private readonly config: ConfigService,
    private readonly getAuthorizeUrl: GetRsoAuthorizeUrlUseCase,
    private readonly exchangeCode: ExchangeRsoCodeUseCase,
    private readonly refreshTokens: RefreshRsoTokensUseCase,
    private readonly getRsoUserinfo: GetRsoUserinfoUseCase,
    private readonly establishWpggSession: EstablishRiotOauthSessionUseCase,
  ) {}

  /** Minimal HTML index with a Sign In link (tutorial-style). */
  @Get()
  index(@Res() res: Response) {
    const { authorizeUrl } = this.getAuthorizeUrl.execute({});
    const href = authorizeUrl.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    res.type('html').send(
      `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>Riot Sign On</title></head><body><p><a href="${href}">Sign In with Riot</a></p></body></html>`,
    );
  }

  @Get('sign-in')
  signIn(
    @Query() query: RsoSignInQueryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { authorizeUrl, state } = this.getAuthorizeUrl.execute({
      loginHint: query.loginHint,
      uiLocales: query.uiLocales,
    });
    if (query.redirect === 'true' || query.redirect === '1') {
      return res.redirect(authorizeUrl);
    }
    return { authorizeUrl, state };
  }

  @Get('oauth2-callback')
  async oauth2Callback(
    @Res({ passthrough: true }) res: Response,
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Query('error') error?: string,
    @Query('error_description') errorDescription?: string,
    @Query('includeUserinfo') includeUserinfo?: string,
  ) {
    const successRedirect =
      this.config.get<string>('RIOT_RSO_SUCCESS_REDIRECT_URL')?.trim() ?? '';

    if (error) {
      if (successRedirect) {
        const target = new URL(successRedirect);
        target.searchParams.set('error', error);
        if (errorDescription) {
          target.searchParams.set('error_description', errorDescription);
        }
        res.redirect(HttpStatus.FOUND, target.toString());
        return;
      }
      throw new BadRequestException({
        error,
        error_description: errorDescription,
      });
    }
    if (!code?.trim() || !state?.trim()) {
      throw new BadRequestException('Missing code or state');
    }
    const payload = await this.exchangeCode.execute({
      code,
      state,
      includeUserinfo:
        includeUserinfo === 'true' || includeUserinfo === '1',
    });

    if (successRedirect) {
      const claims = payload.id_token_claims;
      let riotSub =
        claims && typeof claims.sub === 'string' ? claims.sub : undefined;
      if (!riotSub) {
        try {
          const ui = await this.getRsoUserinfo.execute(payload.access_token);
          riotSub = ui.sub;
        } catch {
          const target = new URL(successRedirect);
          target.searchParams.set('error', 'rso_no_subject');
          res.redirect(HttpStatus.FOUND, target.toString());
          return;
        }
      }

      const session = await this.establishWpggSession.execute({
        riotSub,
      });
      attachSessionCookies(res, this.config, session);

      const target = new URL(successRedirect);
      res.redirect(HttpStatus.FOUND, target.toString());
      return;
    }

    return payload;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: RsoRefreshRequestDto) {
    const tokens = await this.refreshTokens.execute(
      body.refreshToken,
      body.scope,
    );
    return {
      scope: tokens.scope,
      expires_in: tokens.expires_in,
      token_type: tokens.token_type,
      sub_sid: tokens.sub_sid,
      access_token: tokens.access_token,
      id_token: tokens.id_token,
      refresh_token: tokens.refresh_token,
    };
  }

  @Post('userinfo')
  @HttpCode(HttpStatus.OK)
  async userinfo(@Body() body: RsoUserinfoRequestDto) {
    return this.getRsoUserinfo.execute(body.accessToken);
  }
}
