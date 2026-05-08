export declare class ChampionEntity {
    readonly id: string;
    readonly key: string;
    readonly name: string;
    readonly title: string;
    readonly blurb: string;
    readonly tags: string[];
    readonly stats: ChampionStats;
    readonly imageUrl: string;
    constructor(id: string, key: string, name: string, title: string, blurb: string, tags: string[], stats: ChampionStats, imageUrl: string);
}
export interface ChampionStats {
    hp: number;
    armor: number;
    spellblock: number;
    attackdamage: number;
    attackspeed: number;
    movespeed: number;
}
