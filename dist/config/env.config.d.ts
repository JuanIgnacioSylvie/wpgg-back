declare enum NodeEnvironment {
    Development = "development",
    Production = "production",
    Test = "test"
}
declare class EnvironmentVariables {
    DATABASE_URL: string;
    JWT_SECRET: string;
    JWT_ACCESS_EXPIRY: string;
    JWT_REFRESH_EXPIRY: string;
    RIOT_API_KEY: string;
    PORT: number;
    NODE_ENV: NodeEnvironment;
    ALLOWED_ORIGINS: string;
}
export declare function validate(config: Record<string, unknown>): EnvironmentVariables;
export {};
