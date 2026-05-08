import { Inject, Injectable } from '@nestjs/common';
import {
  DDRAGON_SERVICE,
  IDdragonService,
} from '../../domain/services/ddragon.service.interface';

@Injectable()
export class GetCurrentVersionUseCase {
  constructor(
    @Inject(DDRAGON_SERVICE)
    private readonly ddragonService: IDdragonService,
  ) {}

  execute(): Promise<string> {
    return this.ddragonService.getCurrentVersion();
  }
}
