import { Module } from '@nestjs/common';
import { EmailModule } from './infrastructure/email/email.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule, EmailModule],
  exports: [PrismaModule, EmailModule],
})
export class SharedModule {}
