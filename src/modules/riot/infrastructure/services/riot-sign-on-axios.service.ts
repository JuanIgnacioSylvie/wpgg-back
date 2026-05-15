import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  IRiotSignOnService,
  RiotRsoAccountMe,
  RiotRsoLoLSummonerMe,
  RiotRsoTokenResponse,
  RiotRsoUserinfo,
} from '../../domain/services/riot-sign-on.service.interface';

const PROVIDER = 'https://auth.riotgames.com';
const TOKEN_URL = `${PROVIDER}/token`;
const USERINFO_URL = `${PROVIDER}/userinfo`;

@Injectable()
export class RiotSignOnAxiosService implements IRiotSignOnService {
  private readonly http: AxiosInstance;

  constructor(private readonly config: ConfigService) {
    this.http = axios.create({
      timeout: 15_000,
      validateStatus: () => true,
    });
  }

  private rsoConfig(): {
    clientId: string;
    redirectUri: string;
    clientSecret?: string;
    clientAssertion?: string;
  } {
    const clientId = this.config.get<string>('RIOT_RSO_CLIENT_ID');
    const redirectUri = this.config.get<string>('RIOT_RSO_REDIRECT_URI');
    const clientSecret = this.config.get<string>('RIOT_RSO_CLIENT_SECRET');
    const clientAssertion = this.config.get<string>('RIOT_RSO_CLIENT_ASSERTION');
    if (!clientId?.trim() || !redirectUri?.trim()) {
      throw new ServiceUnavailableException(
        'Riot Sign On is not configured (RIOT_RSO_CLIENT_ID, RIOT_RSO_REDIRECT_URI)',
      );
    }
    if (!clientSecret?.trim() && !clientAssertion?.trim()) {
      throw new ServiceUnavailableException(
        'Riot Sign On needs RIOT_RSO_CLIENT_SECRET (basic) or RIOT_RSO_CLIENT_ASSERTION (JWT bearer)',
      );
    }
    return {
      clientId: clientId.trim(),
      redirectUri: redirectUri.trim(),
      clientSecret: clientSecret?.trim() || undefined,
      clientAssertion: clientAssertion?.trim() || undefined,
    };
  }

  private tokenHeaders(
    clientId: string,
    clientSecret: string | undefined,
    useClientAssertion: boolean,
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    if (!useClientAssertion && clientSecret) {
      const basic = Buffer.from(`${clientId}:${clientSecret}`, 'utf8').toString(
        'base64',
      );
      headers.Authorization = `Basic ${basic}`;
    }
    return headers;
  }

  private appendClientAssertion(
    body: URLSearchParams,
    clientAssertion: string | undefined,
  ): void {
    if (clientAssertion) {
      body.set(
        'client_assertion_type',
        'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      );
      body.set('client_assertion', clientAssertion);
    }
  }

  async exchangeAuthorizationCode(
    code: string,
    redirectUri: string,
  ): Promise<RiotRsoTokenResponse> {
    const { clientId, clientSecret, clientAssertion } = this.rsoConfig();
    const body = new URLSearchParams();
    body.set('grant_type', 'authorization_code');
    body.set('code', code);
    body.set('redirect_uri', redirectUri);
    this.appendClientAssertion(body, clientAssertion);

    const res = await this.http.post(TOKEN_URL, body.toString(), {
      headers: this.tokenHeaders(
        clientId,
        clientSecret,
        Boolean(clientAssertion),
      ),
    });

    if (res.status !== 200 || typeof res.data !== 'object' || !res.data) {
      const detail =
        typeof res.data === 'object' && res.data && 'error' in res.data
          ? JSON.stringify(res.data)
          : res.statusText;
      throw new ServiceUnavailableException(
        `Riot token endpoint failed (${res.status}): ${detail}`,
      );
    }

    const d = res.data as Record<string, unknown>;
    if (
      typeof d.access_token !== 'string' ||
      typeof d.expires_in !== 'number' ||
      typeof d.token_type !== 'string' ||
      typeof d.scope !== 'string'
    ) {
      throw new ServiceUnavailableException(
        'Riot token response missing required fields',
      );
    }

    return {
      scope: d.scope as string,
      expires_in: d.expires_in as number,
      token_type: d.token_type as string,
      refresh_token:
        typeof d.refresh_token === 'string' ? d.refresh_token : undefined,
      id_token: typeof d.id_token === 'string' ? d.id_token : undefined,
      access_token: d.access_token as string,
      sub_sid: typeof d.sub_sid === 'string' ? d.sub_sid : undefined,
    };
  }

  async refreshAccessToken(
    refreshToken: string,
    scope?: string,
  ): Promise<RiotRsoTokenResponse> {
    const { clientId, clientSecret, clientAssertion } = this.rsoConfig();
    const body = new URLSearchParams();
    body.set('grant_type', 'refresh_token');
    body.set('refresh_token', refreshToken);
    if (scope?.trim()) {
      body.set('scope', scope.trim());
    }
    this.appendClientAssertion(body, clientAssertion);

    const res = await this.http.post(TOKEN_URL, body.toString(), {
      headers: this.tokenHeaders(
        clientId,
        clientSecret,
        Boolean(clientAssertion),
      ),
    });

    if (res.status !== 200 || typeof res.data !== 'object' || !res.data) {
      const detail =
        typeof res.data === 'object' && res.data && 'error' in res.data
          ? JSON.stringify(res.data)
          : res.statusText;
      throw new ServiceUnavailableException(
        `Riot token refresh failed (${res.status}): ${detail}`,
      );
    }

    const d = res.data as Record<string, unknown>;
    if (
      typeof d.access_token !== 'string' ||
      typeof d.expires_in !== 'number' ||
      typeof d.token_type !== 'string' ||
      typeof d.scope !== 'string'
    ) {
      throw new ServiceUnavailableException(
        'Riot refresh response missing required fields',
      );
    }

    return {
      scope: d.scope as string,
      expires_in: d.expires_in as number,
      token_type: d.token_type as string,
      refresh_token:
        typeof d.refresh_token === 'string' ? d.refresh_token : undefined,
      id_token: typeof d.id_token === 'string' ? d.id_token : undefined,
      access_token: d.access_token as string,
      sub_sid: typeof d.sub_sid === 'string' ? d.sub_sid : undefined,
    };
  }

  async getUserinfo(accessToken: string): Promise<RiotRsoUserinfo> {
    const res = await this.http.get(USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (res.status !== 200 || typeof res.data !== 'object' || !res.data) {
      const detail =
        typeof res.data === 'object' && res.data && 'error' in res.data
          ? JSON.stringify(res.data)
          : res.statusText;
      throw new ServiceUnavailableException(
        `Riot userinfo failed (${res.status}): ${detail}`,
      );
    }

    const d = res.data as Record<string, unknown>;
    if (typeof d.sub !== 'string') {
      throw new ServiceUnavailableException('Riot userinfo missing sub');
    }

    return {
      sub: d.sub,
      cpid: typeof d.cpid === 'string' ? d.cpid : undefined,
    };
  }

  async getAccountMe(accessToken: string): Promise<RiotRsoAccountMe> {
    const clusters = ['americas', 'europe', 'asia'] as const;
    let lastStatus = 0;
    let lastDetail: string | undefined;

    for (const cluster of clusters) {
      const url = `https://${cluster}.api.riotgames.com/riot/account/v1/accounts/me`;
      const res = await this.http.get(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.status === 200 && typeof res.data === 'object' && res.data) {
        const d = res.data as Record<string, unknown>;
        if (typeof d.puuid === 'string') {
          return {
            puuid: d.puuid,
            gameName:
              typeof d.gameName === 'string' ? d.gameName : '',
            tagLine: typeof d.tagLine === 'string' ? d.tagLine : '',
          };
        }
      }
      lastStatus = res.status;
      lastDetail =
        typeof res.data === 'object' && res.data && 'status' in res.data
          ? JSON.stringify((res.data as { status?: unknown }).status)
          : res.statusText;
    }

    throw new ServiceUnavailableException(
      `Riot accounts/me failed (last HTTP ${lastStatus}): ${lastDetail ?? 'unknown'}`,
    );
  }

  async getLoLSummonerMe(
    accessToken: string,
    platformId: string,
  ): Promise<RiotRsoLoLSummonerMe> {
    const platform = platformId.trim().toLowerCase();
    if (!platform) {
      throw new ServiceUnavailableException('Platform id is required');
    }
    const url = `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/me`;
    const res = await this.http.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.status !== 200 || typeof res.data !== 'object' || !res.data) {
      const detail =
        typeof res.data === 'object' && res.data && 'status' in res.data
          ? JSON.stringify((res.data as { status?: unknown }).status)
          : res.statusText;
      throw new ServiceUnavailableException(
        `Riot summoners/me failed (${res.status}): ${detail}`,
      );
    }

    const d = res.data as Record<string, unknown>;
    if (typeof d.puuid !== 'string') {
      throw new ServiceUnavailableException(
        'Riot summoners/me missing puuid',
      );
    }

    return {
      puuid: d.puuid,
      summonerId: d.id != null ? String(d.id) : '',
      accountId: d.accountId != null ? String(d.accountId) : '',
      profileIconId:
        typeof d.profileIconId === 'number' ? d.profileIconId : 0,
      summonerLevel:
        typeof d.summonerLevel === 'number' ? d.summonerLevel : 0,
      revisionDate:
        typeof d.revisionDate === 'number' ? d.revisionDate : 0,
    };
  }
}
