export type RiotAccountCreateProps = Pick<RiotAccountEntity, 'id' | 'userId' | 'puuid' | 'gameName' | 'tagLine' | 'region' | 'summonerId' | 'accountId'>;
export declare class RiotAccountEntity {
    readonly id: string;
    readonly userId: string;
    readonly puuid: string;
    readonly gameName: string;
    readonly tagLine: string;
    readonly region: string;
    readonly summonerId: string;
    readonly accountId: string;
    readonly linkedAt: Date;
    constructor(id: string, userId: string, puuid: string, gameName: string, tagLine: string, region: string, summonerId: string, accountId: string, linkedAt: Date);
    static create(props: RiotAccountCreateProps): RiotAccountEntity;
    getRiotId(): string;
}
