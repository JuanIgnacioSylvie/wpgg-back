import { RefreshTokenEntity } from '../domain/entities/refresh-token.entity';
import { IHashProvider } from '../domain/providers/hash.provider.interface';
export declare function findRefreshTokenByPlain(plain: string, tokens: RefreshTokenEntity[], hashProvider: IHashProvider): Promise<RefreshTokenEntity | null>;
