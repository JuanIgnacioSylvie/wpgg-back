import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { SharedModule } from '@shared/shared.module';
import { GetChampionDetailUseCase } from '../application/use-cases/get-champion-detail.use-case';
import { GetChampionsUseCase } from '../application/use-cases/get-champions.use-case';
import { GetCurrentVersionUseCase } from '../application/use-cases/get-current-version.use-case';
import { DDRAGON_SERVICE } from '../domain/services/ddragon.service.interface';
import { DdragonServiceAxios } from '../infrastructure/services/ddragon-service-axios';
import { DdragonController } from './ddragon.controller';

@Module({
  imports: [
    SharedModule,
    CacheModule.register({
      ttl: 3600000,
    }),
  ],
  controllers: [DdragonController],
  providers: [
    { provide: DDRAGON_SERVICE, useClass: DdragonServiceAxios },
    GetCurrentVersionUseCase,
    GetChampionsUseCase,
    GetChampionDetailUseCase,
  ],
})
export class DdragonModule {}
