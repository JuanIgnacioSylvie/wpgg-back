export const RIOT_SESSION_EXCHANGE_CODE_REPOSITORY = Symbol(
  'IRiotSessionExchangeCodeRepository',
);

export type CreateRiotSessionExchangeCodeRow = {
  codeHash: string;
  userId: string;
  expiresAt: Date;
};

export interface IRiotSessionExchangeCodeRepository {
  create(row: CreateRiotSessionExchangeCodeRow): Promise<void>;
  /**
   * Atomically marks a valid code as used and returns the userId.
   * Returns null if no matching unused non-expired row.
   */
  consumeActiveByCodeHash(codeHash: string): Promise<{ userId: string } | null>;
}
