export const EMAIL_VERIFICATION_TOKEN_REPOSITORY = Symbol(
  'IEmailVerificationTokenRepository',
);

export type CreateEmailVerificationTokenRow = {
  codeHash: string;
  userId: string;
  riotLinkPendingCode?: string;
  expiresAt: Date;
};

export type ConsumedEmailVerificationToken = {
  userId: string;
  riotLinkPendingCode?: string;
};

export interface IEmailVerificationTokenRepository {
  create(row: CreateEmailVerificationTokenRow): Promise<void>;
  invalidateActiveForUser(userId: string): Promise<void>;
  consumeActiveByCodeHash(
    codeHash: string,
  ): Promise<ConsumedEmailVerificationToken | null>;
}
