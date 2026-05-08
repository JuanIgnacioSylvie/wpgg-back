import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { UserEntity } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
export declare class PrismaUserRepository implements IUserRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<UserEntity | null>;
    findByEmail(email: string): Promise<UserEntity | null>;
    save(user: UserEntity): Promise<UserEntity>;
    existsByEmail(email: string): Promise<boolean>;
}
