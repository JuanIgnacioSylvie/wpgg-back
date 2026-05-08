import { Inject, Injectable } from '@nestjs/common';
import { ChampionEntity } from '../../domain/entities/champion.entity';
import {
  DDRAGON_SERVICE,
  IDdragonService,
} from '../../domain/services/ddragon.service.interface';

@Injectable()
export class GetChampionsUseCase {
  constructor(
    @Inject(DDRAGON_SERVICE)
    private readonly ddragonService: IDdragonService,
  ) {}

  async execute(): Promise<ChampionEntity[]> {
    const version = await this.ddragonService.getCurrentVersion();
    return this.ddragonService.getChampions(version);
  }
}
