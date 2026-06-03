import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  Post,
  Body,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '@shared/infrastructure/guards/jwt-auth.guard';
import { CreateRiotPendingLinkCodeUseCase } from '@modules/auth/application/use-cases/create-riot-pending-link-code.use-case';
import { ConfigService } from '@nestjs/config';
import { attachSessionCookies } from '@modules/auth/infrastructure/auth-session-cookies';
import { CreateRiotSessionExchangeCodeUseCase } from '@modules/auth/application/use-cases/create-riot-session-exchange-code.use-case';
import { EstablishRiotOauthSessionUseCase } from '@modules/auth/application/use-cases/establish-riot-oauth-session.use-case';
import type { Response } from 'express';
import {
  isEstablishRiotOauthSessionError,
} from '@modules/auth/application/use-cases/establish-riot-oauth-session.use-case';
import {
  IRsoStateSigner,
  RSO_STATE_SIGNER,
} from '../domain/services/rso-state-signer.interface';
import { ExchangeRsoCodeUseCase } from '../application/use-cases/exchange-rso-code.use-case';
import { GetRsoAuthorizeUrlUseCase } from '../application/use-cases/get-rso-authorize-url.use-case';
import { GetRsoUserinfoUseCase } from '../application/use-cases/get-rso-userinfo.use-case';
import { LinkRiotAccountFromRsoUseCase } from '../application/use-cases/link-riot-account-from-rso.use-case';
import { RefreshRsoTokensUseCase } from '../application/use-cases/refresh-rso-tokens.use-case';
import { RsoRefreshRequestDto } from './dto/rso-refresh-request.dto';
import { RsoSignInQueryDto } from './dto/rso-sign-in-query.dto';
import { RsoUserinfoRequestDto } from './dto/rso-userinfo-request.dto';

/**
 * Riot Sign On (OAuth2 / OIDC) — public routes for authorization code flow.
 * Configure RIOT_RSO_CLIENT_ID, RIOT_RSO_REDIRECT_URI, and either
 * RIOT_RSO_CLIENT_SECRET or RIOT_RSO_CLIENT_ASSERTION.
 * Optional: RIOT_RSO_SUCCESS_REDIRECT_URL — after login, issues wpgg cookies and redirects
 * there with `?riot_session=<one-time code>` (plus cookies on the API host). The SPA redeems
 * the code via `POST /auth/riot-session`. If the code cannot be stored, redirects with
 * `?error=riot_session_unavailable` (no session cookies). On OAuth error, `?error=` /
 * `?error_description=`; missing Riot subject: `?error=rso_no_subject`.
 * Intent mismatch: `?error=user_not_found&intent=login` or `?error=user_already_exists&intent=register`.
 */
@Controller('riot/rso')
export class RiotRsoController {
  private readonly logger = new Logger(RiotRsoController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly getAuthorizeUrl: GetRsoAuthorizeUrlUseCase,
    private readonly exchangeCode: ExchangeRsoCodeUseCase,
    private readonly refreshTokens: RefreshRsoTokensUseCase,
    private readonly getRsoUserinfo: GetRsoUserinfoUseCase,
    private readonly establishWpggSession: EstablishRiotOauthSessionUseCase,
    private readonly createRiotSessionCode: CreateRiotSessionExchangeCodeUseCase,
    private readonly linkRiotFromRso: LinkRiotAccountFromRsoUseCase,
    private readonly createRiotPendingLinkCode: CreateRiotPendingLinkCodeUseCase,
    @Inject(RSO_STATE_SIGNER) private readonly stateSigner: IRsoStateSigner,
  ) {}

  /** Minimal HTML index with Sign In / Sign Up links (tutorial-style). */
  @Get()
  index(@Res() res: Response) {
    const signIn = this.getAuthorizeUrl.execute({ intent: 'login' });
    const signUp = this.getAuthorizeUrl.execute({ intent: 'register' });
    const signInHref = signIn.authorizeUrl
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;');
    const signUpHref = signUp.authorizeUrl
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;');
    res.type('html').send(
      `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>Riot Sign On</title></head><body><p><a href="${signInHref}">Sign In with Riot</a></p><p><a href="${signUpHref}">Sign Up with Riot</a></p></body></html>`,
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
      intent: 'login',
    });
    if (query.redirect === 'true' || query.redirect === '1') {
      return res.redirect(authorizeUrl);
    }
    return { authorizeUrl, state };
  }

  /** Link Riot to an existing WPGG user (JWT required; returns authorize URL). */
  @Get('link')
  @UseGuards(JwtAuthGuard)
  linkAccount(
    @CurrentUser() userId: string,
    @Query() query: RsoSignInQueryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { authorizeUrl, state } = this.getAuthorizeUrl.execute({
      loginHint: query.loginHint,
      uiLocales: query.uiLocales,
      intent: 'link',
      wpggUserId: userId,
    });
    if (query.redirect === 'true' || query.redirect === '1') {
      return res.redirect(authorizeUrl);
    }
    return { authorizeUrl, state };
  }

  @Get('sign-up')
  signUp(
    @Query() query: RsoSignInQueryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { authorizeUrl, state } = this.getAuthorizeUrl.execute({
      loginHint: query.loginHint,
      uiLocales: query.uiLocales,
      intent: 'register',
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
    const parsedState = this.stateSigner.parse(state);
    const oauthIntent = parsedState?.intent ?? 'login';

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

      let rsoCpid: string | undefined;
      try {
        const ui = await this.getRsoUserinfo.execute(payload.access_token);
        rsoCpid = ui.cpid;
      } catch (err) {
        this.logger.warn(
          `RSO userinfo for auto-link failed: ${
            err instanceof Error ? err.message : err
          }`,
        );
      }

      let session: {
        userId: string;
        accessToken: string;
        refreshToken: string;
        rememberMe: boolean;
      };

      if (oauthIntent === 'link') {
        const wpggUserId = parsedState?.wpggUserId?.trim();
        if (!wpggUserId) {
          const target = new URL(successRedirect);
          target.searchParams.set('error', 'rso_invalid_link_state');
          res.redirect(HttpStatus.FOUND, target.toString());
          return;
        }
        session =
          await this.establishWpggSession.issueSessionForExistingUser(
            wpggUserId,
          );
      } else {
        const sessionResult = await this.establishWpggSession.execute({
          riotSub,
          intent: oauthIntent,
        });

        if (isEstablishRiotOauthSessionError(sessionResult)) {
          const target = new URL(successRedirect);
          target.searchParams.set('error', sessionResult.error);
          target.searchParams.set('intent', oauthIntent);
          if (sessionResult.error === 'user_not_found') {
            try {
              const { code: pendingCode } =
                await this.createRiotPendingLinkCode.execute({
                  riotSub,
                  accessToken: payload.access_token,
                  cpid: rsoCpid,
                });
              target.searchParams.set('riot_link_pending', pendingCode);
            } catch (err) {
              this.logger.warn(
                `riot_link_pending not created: ${
                  err instanceof Error ? err.message : err
                }`,
              );
            }
          }
          res.redirect(HttpStatus.FOUND, target.toString());
          return;
        }
        session = sessionResult;
      }

      const linked = await this.linkRiotFromRso.execute({
        userId: session.userId,
        accessToken: payload.access_token,
        cpid: rsoCpid,
      });
      if (linked) {
        this.logger.log(`RSO auto-linked summoner for user ${session.userId}`);
      }

      const target = new URL(successRedirect);
      let riotSessionPlain: string;
      try {
        const { code } = await this.createRiotSessionCode.execute({
          userId: session.userId,
        });
        riotSessionPlain = code;
      } catch (err) {
        this.logger.error(
          `riot_session code not created: ${err instanceof Error ? err.stack ?? err.message : err}`,
        );
        target.searchParams.set('error', 'riot_session_unavailable');
        const hint =
          err instanceof Error ? err.message : 'session_code_failed';
        target.searchParams.set(
          'error_description',
          hint.length > 240 ? `${hint.slice(0, 237)}...` : hint,
        );
        res.redirect(HttpStatus.FOUND, target.toString());
        return;
      }

      attachSessionCookies(res, this.config, session);
      target.searchParams.set('riot_session', riotSessionPlain);
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
