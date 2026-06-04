import { createHash } from 'crypto';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { UserEntity } from '../../domain/entities/user.entity';
import {
  HASH_PROVIDER,
  IHashProvider,
} from '../../domain/providers/hash.provider.interface';
import {
  IPasswordResetTokenRepository,
  PASSWORD_RESET_TOKEN_REPOSITORY,
} from '../../domain/repositories/password-reset-token.repository.interface';
import {
  IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from '../../domain/repositories/refresh-token.repository.interface';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';

export type ResetPasswordInput = { token: string; password: string };

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY)
    private readonly resetTokens: IPasswordResetTokenRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Inject(HASH_PROVIDER)
    private readonly hashProvider: IHashProvider,
  ) {}

  async execute(input: ResetPasswordInput): Promise<void> {
    const trimmed = input.token?.trim();
    if (!trimmed) {
      throw new BadRequestException('Enlace inválido o expirado');
    }

    const codeHash = createHash('sha256').update(trimmed, 'utf8').digest('hex');
    const consumed = await this.resetTokens.consumeActiveByCodeHash(codeHash);
    if (!consumed) {
      throw new BadRequestException('Enlace inválido o expirado');
    }

    const user = await this.userRepository.findById(consumed.userId);
    if (!user) {
      throw new BadRequestException('Enlace inválido o expirado');
    }

    const passwordHash = await this.hashProvider.hash(input.password);
    const updated = new UserEntity(
      user.id,
      user.email,
      passwordHash,
      user.createdAt,
      new Date(),
    );

    try {
      await this.userRepository.save(updated);
      await this.refreshTokenRepository.revokeAllForUser(user.id);
    } catch {
      throw new InternalServerErrorException();
    }
  }
}
