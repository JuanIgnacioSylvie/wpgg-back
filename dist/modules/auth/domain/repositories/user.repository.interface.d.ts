import { UserEntity } from '../entities/user.entity';
export declare const USER_REPOSITORY: unique symbol;
export interface IUserRepository {
    findById(id: string): Promise<UserEntity | null>;
    findByEmail(email: string): Promise<UserEntity | null>;
    save(user: UserEntity): Promise<UserEntity>;
    existsByEmail(email: string): Promise<boolean>;
}
