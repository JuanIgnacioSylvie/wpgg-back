export declare class UserEntity {
    readonly id: string;
    readonly email: string;
    readonly passwordHash: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    constructor(id: string, email: string, passwordHash: string, createdAt: Date, updatedAt: Date);
    static create(props: {
        id: string;
        email: string;
        passwordHash: string;
    }): UserEntity;
    isValidEmail(): boolean;
}
