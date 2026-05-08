export declare const HASH_PROVIDER: unique symbol;
export interface IHashProvider {
    hash(plain: string): Promise<string>;
    compare(plain: string, hashed: string): Promise<boolean>;
}
