import { RiotAccountEntity } from '../entities/riot-account.entity';
export declare const RIOT_ACCOUNT_REPOSITORY: unique symbol;
export interface IRiotAccountRepository {
    findByUserId(userId: string): Promise<RiotAccountEntity | null>;
    findByPuuid(puuid: string): Promise<RiotAccountEntity | null>;
    save(account: RiotAccountEntity): Promise<RiotAccountEntity>;
}
