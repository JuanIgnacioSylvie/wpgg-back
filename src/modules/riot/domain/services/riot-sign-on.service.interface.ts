export const RIOT_SIGN_ON_SERVICE = Symbol('RIOT_SIGN_ON_SERVICE');

export type RiotRsoTokenResponse = {
  scope: string;
  expires_in: number;
  token_type: string;
  refresh_token?: string;
  id_token?: string;
  access_token: string;
  sub_sid?: string;
};

export type RiotRsoUserinfo = {
  sub: string;
  cpid?: string;
};

export interface IRiotSignOnService {
  exchangeAuthorizationCode(
    code: string,
    redirectUri: string,
  ): Promise<RiotRsoTokenResponse>;

  refreshAccessToken(
    refreshToken: string,
    scope?: string,
  ): Promise<RiotRsoTokenResponse>;

  getUserinfo(accessToken: string): Promise<RiotRsoUserinfo>;
}
