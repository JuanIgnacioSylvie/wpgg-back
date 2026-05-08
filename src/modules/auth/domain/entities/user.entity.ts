export class UserEntity {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(props: {
    id: string;
    email: string;
    passwordHash: string;
  }): UserEntity {
    const now = new Date();
    return new UserEntity(props.id, props.email, props.passwordHash, now, now);
  }

  isValidEmail(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
  }
}
