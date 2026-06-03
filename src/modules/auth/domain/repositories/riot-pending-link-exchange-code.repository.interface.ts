export const RIOT_PENDING_LINK_EXCHANGE_CODE_REPOSITORY = Symbol(
  'RIOT_PENDING_LINK_EXCHANGE_CODE_REPOSITORY',
);

export type CreateRiotPendingLinkExchangeCodeRow = {
  codeHash: string;
  riotSub: string;
  accessToken: string;
  cpid?: string;
  expiresAt: Date;
};

export type ConsumedRiotPendingLink = {
  riotSub: string;
  accessToken: string;
  cpid?: string;
};

export interface IRiotPendingLinkExchangeCodeRepository {
  create(row: CreateRiotPendingLinkExchangeCodeRow): Promise<void>;
  consumeActiveByCodeHash(
    codeHash: string,
  ): Promise<ConsumedRiotPendingLink | null>;
}
