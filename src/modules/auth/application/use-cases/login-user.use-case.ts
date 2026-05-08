import {
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RefreshTokenEntity } from '../../domain/entities/refresh-token.entity';
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

export type LoginUserInput = { email: string; password: string };

export type LoginUserOutput = { accessToken: string; refreshToken: string };

@Injectable()
export class LoginUserUseCase {
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

  async execute(input: LoginUserInput): Promise<LoginUserOutput> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await this.hashProvider.compare(
      input.password,
      user.passwordHash,
    );
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    try {
      await this.refreshTokenRepository.enforceMaxActiveTokensForUser(
        user.id,
        5,
      );

      const accessToken = this.jwtProvider.generateAccessToken(user.id);
      const { token: rawRefreshToken, expiresAt } =
        this.jwtProvider.generateRefreshToken(user.id);
      const tokenHash = await this.hashProvider.hash(rawRefreshToken);

      const refreshEntity = RefreshTokenEntity.create({
        id: randomUUID(),
        tokenHash,
        userId: user.id,
        expiresAt,
      });
      await this.refreshTokenRepository.save(refreshEntity);
      return { accessToken, refreshToken: rawRefreshToken };
    } catch {
      throw new InternalServerErrorException();
    }
  }
}
