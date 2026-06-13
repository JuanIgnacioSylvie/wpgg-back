import { Module } from '@nestjs/common';
import { AuthModule } from '@modules/auth/presentation/auth.module';
import { SubmitSponsorProposalUseCase } from '../application/use-cases/submit-sponsor-proposal.use-case';
import { SubmitSupportRequestUseCase } from '../application/use-cases/submit-support-request.use-case';
import { ContactController } from './contact.controller';

@Module({
  imports: [AuthModule],
  controllers: [ContactController],
  providers: [SubmitSponsorProposalUseCase, SubmitSupportRequestUseCase],
})
export class ContactModule {}
