import { UserEntity } from '../entities/user.entity';

export const USER_REPOSITORY = Symbol('IUserRepository');

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  save(user: UserEntity): Promise<UserEntity>;
  existsByEmail(email: string): Promise<boolean>;
}
