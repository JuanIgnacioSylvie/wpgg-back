export type RiotAccountCreateProps = Pick<
  RiotAccountEntity,
  | 'id'
  | 'userId'
  | 'puuid'
  | 'gameName'
  | 'tagLine'
  | 'region'
  | 'summonerId'
  | 'accountId'
>;

export class RiotAccountEntity {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly puuid: string,
    public readonly gameName: string,
    public readonly tagLine: string,
    public readonly region: string,
    public readonly summonerId: string,
    public readonly accountId: string,
    public readonly linkedAt: Date,
  ) {}

  static create(props: RiotAccountCreateProps): RiotAccountEntity {
    return new RiotAccountEntity(
      props.id,
      props.userId,
      props.puuid,
      props.gameName,
      props.tagLine,
      props.region,
      props.summonerId,
      props.accountId,
      new Date(),
    );
  }

  getRiotId(): string {
    return `${this.gameName}#${this.tagLine}`;
  }
}
