export class UserEntity {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly emailVerifiedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(props: {
    id: string;
    email: string;
    passwordHash: string;
    emailVerifiedAt?: Date | null;
  }): UserEntity {
    const now = new Date();
    return new UserEntity(
      props.id,
      props.email,
      props.passwordHash,
      props.emailVerifiedAt ?? null,
      now,
      now,
    );
  }

  isEmailVerified(): boolean {
    return this.emailVerifiedAt != null;
  }

  withEmailVerifiedAt(at: Date): UserEntity {
    return new UserEntity(
      this.id,
      this.email,
      this.passwordHash,
      at,
      this.createdAt,
      new Date(),
    );
  }

  isValidEmail(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
  }
}
