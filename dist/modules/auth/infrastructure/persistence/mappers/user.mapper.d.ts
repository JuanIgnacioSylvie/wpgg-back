import { User as PrismaUser } from '@prisma/client';
import { UserEntity } from '../../../domain/entities/user.entity';
export declare class UserMapper {
    static toDomain(row: PrismaUser): UserEntity;
    static toPrisma(entity: UserEntity): Omit<PrismaUser, 'riotAccount' | 'refreshTokens'>;
}
