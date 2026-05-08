import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { IHashProvider } from '../../domain/providers/hash.provider.interface';

@Injectable()
export class BcryptHashProvider implements IHashProvider {
  private static readonly ROUNDS = 12;

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, BcryptHashProvider.ROUNDS);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
