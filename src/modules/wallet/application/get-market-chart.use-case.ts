import { Injectable } from '@nestjs/common';
import { WpggMarketPriceService } from './wpgg-market-price.service';

@Injectable()
export class GetMarketChartUseCase {
  constructor(private readonly marketPrices: WpggMarketPriceService) {}

  async execute(days = 7) {
    const clamped = Math.min(Math.max(days, 1), 30);
    const points = await this.marketPrices.getChart(clamped);
    return { points };
  }
}
