import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../../auth/presentation/auth.module';
import { RiotController } from './riot.controller';
import { RiotRsoController } from './riot-rso.controller';
import { RiotCoreModule } from './riot-core.module';

@Module({
  imports: [RiotCoreModule, forwardRef(() => AuthModule)],
  exports: [RiotCoreModule],
  controllers: [RiotController, RiotRsoController],
})
export class RiotModule {}
