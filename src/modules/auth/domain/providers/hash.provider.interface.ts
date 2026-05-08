export const HASH_PROVIDER = Symbol('IHashProvider');

export interface IHashProvider {
  hash(plain: string): Promise<string>;
  compare(plain: string, hashed: string): Promise<boolean>;
}
