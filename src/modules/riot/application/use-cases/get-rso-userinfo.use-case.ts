import { Injectable, Inject } from '@nestjs/common';
import {
  IRiotSignOnService,
  RIOT_SIGN_ON_SERVICE,
} from '../../domain/services/riot-sign-on.service.interface';

@Injectable()
export class GetRsoUserinfoUseCase {
  constructor(
    @Inject(RIOT_SIGN_ON_SERVICE)
    private readonly riotSignOn: IRiotSignOnService,
  ) {}

  execute(accessToken: string) {
    return this.riotSignOn.getUserinfo(accessToken);
  }
}
