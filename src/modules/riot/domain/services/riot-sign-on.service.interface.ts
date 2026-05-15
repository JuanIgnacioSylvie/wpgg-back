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

/** Account-v1 `accounts/me` using the RSO access token (Bearer). */
export type RiotRsoAccountMe = {
  puuid: string;
  gameName: string;
  tagLine: string;
};

/** LoL summoner-v4 `summoners/me` on the player's platform (cpid). */
export type RiotRsoLoLSummonerMe = {
  puuid: string;
  summonerId: string;
  accountId: string;
  profileIconId: number;
  summonerLevel: number;
  revisionDate: number;
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

  getAccountMe(accessToken: string): Promise<RiotRsoAccountMe>;

  getLoLSummonerMe(
    accessToken: string,
    platformId: string,
  ): Promise<RiotRsoLoLSummonerMe>;
}
