export class RefreshTokenEntity {
  constructor(
    public readonly id: string,
    public readonly tokenHash: string,
    public readonly userId: string,
    public readonly expiresAt: Date,
    public readonly createdAt: Date,
    public readonly revoked: boolean,
  ) {}

  static create(props: {
    id: string;
    tokenHash: string;
    userId: string;
    expiresAt: Date;
  }): RefreshTokenEntity {
    // Validate required fields
    if (!props.id || !props.tokenHash || !props.userId || !props.expiresAt) {
      throw new Error(
        'RefreshTokenEntity.create: all fields (id, tokenHash, userId, expiresAt) are required',
      );
    }
    return new RefreshTokenEntity(
      props.id,
      props.tokenHash,
      props.userId,
      props.expiresAt,
      new Date(),
      false,
    );
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isValid(): boolean {
    return !this.revoked && !this.isExpired();
  }
}
