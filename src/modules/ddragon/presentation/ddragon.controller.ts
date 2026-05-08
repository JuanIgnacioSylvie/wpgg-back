import { Controller, Get, Param } from '@nestjs/common';
import { GetChampionDetailUseCase } from '../application/use-cases/get-champion-detail.use-case';
import { GetChampionsUseCase } from '../application/use-cases/get-champions.use-case';
import { GetCurrentVersionUseCase } from '../application/use-cases/get-current-version.use-case';

@Controller('ddragon')
export class DdragonController {
  constructor(
    private readonly currentVersion: GetCurrentVersionUseCase,
    private readonly champions: GetChampionsUseCase,
    private readonly championDetail: GetChampionDetailUseCase,
  ) {}

  @Get('version')
  async version() {
    const version = await this.currentVersion.execute();
    return { version };
  }

  @Get('champions')
  async listChampions() {
    const list = await this.champions.execute();
    return list.map((c) => ({
      id: c.id,
      key: c.key,
      name: c.name,
      title: c.title,
      blurb: c.blurb,
      tags: c.tags,
      stats: c.stats,
      imageUrl: c.imageUrl,
    }));
  }

  @Get('champions/:name')
  async getChampion(@Param('name') name: string) {
    const c = await this.championDetail.execute(decodeURIComponent(name));
    return {
      id: c.id,
      key: c.key,
      name: c.name,
      title: c.title,
      blurb: c.blurb,
      tags: c.tags,
      stats: c.stats,
      imageUrl: c.imageUrl,
    };
  }
}
