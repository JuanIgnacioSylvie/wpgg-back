import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@shared/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { WithdrawalService } from '../application/withdrawal.service';
import { RequestWithdrawalDto } from './dto/request-withdrawal.dto';

@Controller('withdrawals')
@UseGuards(JwtAuthGuard)
export class WithdrawalController {
  constructor(private readonly withdrawalService: WithdrawalService) {}

  @Post()
  request(
    @CurrentUser() userId: string,
    @Body() body: RequestWithdrawalDto,
  ) {
    return this.withdrawalService.requestWithdrawal(
      userId,
      body.walletAddress,
      body.amountWpgg,
    );
  }
}
