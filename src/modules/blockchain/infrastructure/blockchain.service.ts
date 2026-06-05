import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Contract, JsonRpcProvider, Wallet, isAddress, parseUnits } from 'ethers';
import { WPGG_CONTRACT_ABI } from './abis/wpgg-contract.abi';

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);
  private readonly provider: JsonRpcProvider;
  private readonly signer: Wallet;
  private readonly contract: Contract;

  constructor(private readonly configService: ConfigService) {
    const rpcUrl = this.configService.getOrThrow<string>('POLYGON_RPC_URL');
    const privateKey = this.configService.getOrThrow<string>('PRIVATE_KEY');
    const contractAddress =
      this.configService.getOrThrow<string>('CONTRACT_ADDRESS');

    this.provider = new JsonRpcProvider(rpcUrl);
    this.signer = new Wallet(privateKey, this.provider);
    this.contract = new Contract(
      contractAddress,
      WPGG_CONTRACT_ABI,
      this.signer,
    );
  }

  async withdrawReward(
    playerAddress: string,
    amountWpgg: number,
  ): Promise<string> {
    if (!isAddress(playerAddress)) {
      throw new BadRequestException('Invalid wallet address');
    }

    const amountWei = parseUnits(amountWpgg.toString(), 18);

    try {
      const tx = await this.contract.rewardPlayer(playerAddress, amountWei);
      const receipt = await tx.wait();

      if (!receipt || receipt.status !== 1) {
        throw new InternalServerErrorException(
          'Withdrawal transaction failed on-chain',
        );
      }

      return receipt.hash as string;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      this.logger.error('rewardPlayer transaction failed', error);
      throw new InternalServerErrorException(
        'Failed to execute on-chain withdrawal',
      );
    }
  }

  async getPoolBalance(): Promise<string> {
    try {
      const balanceWei: bigint = await this.contract.poolBalance();
      return (balanceWei / 10n ** 18n).toString();
    } catch (error) {
      this.logger.error('poolBalance read failed', error);
      throw new InternalServerErrorException(
        'Failed to read contract pool balance',
      );
    }
  }
}
