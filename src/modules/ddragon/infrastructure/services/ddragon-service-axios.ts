import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import axios from 'axios';
import { ChampionEntity } from '../../domain/entities/champion.entity';
import { IDdragonService } from '../../domain/services/ddragon.service.interface';

const VERSIONS_URL =
  'https://ddragon.leagueoflegends.com/api/versions.json';
const TTL_MS = 3_600_000;

interface ChampionJsonEntry {
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  tags: string[];
  stats: {
    hp: number;
    armor: number;
    spellblock: number;
    attackdamage: number;
    attackspeed: number;
    movespeed: number;
  };
  image: { full: string };
}

function mapChampion(version: string, c: ChampionJsonEntry): ChampionEntity {
  const imageUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${c.image.full}`;
  return new ChampionEntity(
    c.id,
    c.key,
    c.name,
    c.title,
    c.blurb,
    c.tags,
    {
      hp: c.stats.hp,
      armor: c.stats.armor,
      spellblock: c.stats.spellblock,
      attackdamage: c.stats.attackdamage,
      attackspeed: c.stats.attackspeed,
      movespeed: c.stats.movespeed,
    },
    imageUrl,
  );
}

@Injectable()
export class DdragonServiceAxios implements IDdragonService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async getCurrentVersion(): Promise<string> {
    const key = 'ddragon:version';
    const hit = await this.cache.get<string>(key);
    if (hit !== undefined && hit !== null) {
      return hit;
    }
    try {
      const { data } = await axios.get<string[]>(VERSIONS_URL, {
        timeout: 5000,
      });
      const v = data[0];
      if (!v) {
        throw new Error('empty version list');
      }
      await this.cache.set(key, v, TTL_MS);
      return v;
    } catch {
      throw new HttpException(
        'DDragon unavailable',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async getChampions(version: string): Promise<ChampionEntity[]> {
    const key = `ddragon:champions:${version}`;
    const hit = await this.cache.get<ChampionEntity[]>(key);
    if (hit !== undefined && hit !== null) {
      return hit;
    }
    const url = `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`;
    try {
      const { data } = await axios.get<{ data: Record<string, ChampionJsonEntry> }>(
        url,
        { timeout: 5000 },
      );
      const list = Object.values(data.data).map((c) => mapChampion(version, c));
      await this.cache.set(key, list, TTL_MS);
      return list;
    } catch {
      throw new HttpException(
        'DDragon unavailable',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async getChampionDetail(
    version: string,
    championName: string,
  ): Promise<ChampionEntity> {
    const normalized = championName.trim().toLowerCase();
    const champions = await this.getChampions(version);
    const found = champions.find(
      (c) =>
        c.name.toLowerCase() === normalized ||
        c.id.toLowerCase() === normalized,
    );
    if (!found) {
      throw new NotFoundException('Champion not found');
    }
    return found;
  }
}
