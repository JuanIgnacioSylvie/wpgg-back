import { RefreshTokenEntity } from '../domain/entities/refresh-token.entity';
import { IHashProvider } from '../domain/providers/hash.provider.interface';

export async function findRefreshTokenByPlain(
  plain: string,
  tokens: RefreshTokenEntity[],
  hashProvider: IHashProvider,
): Promise<RefreshTokenEntity | null> {
  for (const t of tokens) {
    if (await hashProvider.compare(plain, t.tokenHash)) {
      return t;
    }
  }
  return null;
}
