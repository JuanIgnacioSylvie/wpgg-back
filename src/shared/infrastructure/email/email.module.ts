import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TransactionalEmailRenderer } from './transactional-email.renderer';

@Module({
  imports: [ConfigModule],
  providers: [TransactionalEmailRenderer],
  exports: [TransactionalEmailRenderer],
})
export class EmailModule {}
