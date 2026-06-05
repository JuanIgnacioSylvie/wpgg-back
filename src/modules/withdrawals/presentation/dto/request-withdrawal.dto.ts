import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class RequestWithdrawalDto {
  @IsString()
  @IsNotEmpty()
  walletAddress: string;

  @IsInt()
  @Min(1000)
  amountWpgg: number;
}
