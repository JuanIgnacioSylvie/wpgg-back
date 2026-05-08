import { IHashProvider } from '../../domain/providers/hash.provider.interface';
export declare class BcryptHashProvider implements IHashProvider {
    private static readonly ROUNDS;
    hash(plain: string): Promise<string>;
    compare(plain: string, hashed: string): Promise<boolean>;
}
