export const PASSWORD_RESET_TOKEN_REPOSITORY = Symbol(
  'IPasswordResetTokenRepository',
);

export type CreatePasswordResetTokenRow = {
  codeHash: string;
  userId: string;
  expiresAt: Date;
};

export interface IPasswordResetTokenRepository {
  create(row: CreatePasswordResetTokenRow): Promise<void>;
  invalidateActiveForUser(userId: string): Promise<void>;
  consumeActiveByCodeHash(
    codeHash: string,
  ): Promise<{ userId: string } | null>;
}
