import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RefreshTokenEntity } from '../../domain/entities/refresh-token.entity';
import { UserEntity } from '../../domain/entities/user.entity';
import {
  HASH_PROVIDER,
  IHashProvider,
} from '../../domain/providers/hash.provider.interface';
import {
  IJwtProvider,
  JWT_PROVIDER,
} from '../../domain/providers/jwt.provider.interface';
import {
  IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from '../../domain/repositories/refresh-token.repository.interface';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';

export type RegisterUserInput = { email: string; password: string };

export type RegisterUserOutput = { accessToken: string; refreshToken: string };

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Inject(HASH_PROVIDER)
    private readonly hashProvider: IHashProvider,
    @Inject(JWT_PROVIDER)
    private readonly jwtProvider: IJwtProvider,
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
    const emailExists = await this.userRepository.existsByEmail(input.email);
    if (emailExists) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await this.hashProvider.hash(input.password);
    const userId = randomUUID();
    const user = UserEntity.create({
      id: userId,
      email: input.email,
      passwordHash,
    });

    let savedUser: UserEntity;
    try {
      savedUser = await this.userRepository.save(user);
    } catch {
      throw new InternalServerErrorException();
    }

    const accessToken = this.jwtProvider.generateAccessToken(savedUser.id);
    const { token: rawRefreshToken, expiresAt } =
      this.jwtProvider.generateRefreshToken(savedUser.id, { rememberMe: false });
    const tokenHash = await this.hashProvider.hash(rawRefreshToken);

    const refreshEntity = RefreshTokenEntity.create({
      id: randomUUID(),
      tokenHash,
      userId: savedUser.id,
      expiresAt,
    });

    try {
      await this.refreshTokenRepository.save(refreshEntity);
    } catch {
      throw new InternalServerErrorException();
    }

    return { accessToken, refreshToken: rawRefreshToken };
  }
}
