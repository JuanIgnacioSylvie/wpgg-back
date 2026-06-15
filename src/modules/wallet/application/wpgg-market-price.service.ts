import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { GeckoTerminalClient } from '../infrastructure/providers/gecko-terminal.client';

const CHART_CACHE_PREFIX = 'wpgg:chart:';
const LATEST_CACHE_KEY = 'wpgg:latest';
const CHART_CACHE_TTL_MS = 5 * 60 * 1000;
const LATEST_CACHE_TTL_MS = 60 * 1000;

export type MarketChartPointDto = {
  date: string;
  priceUsd: number;
};

@Injectable()
export class WpggMarketPriceService {
  private readonly logger = new Logger(WpggMarketPriceService.name);

  constructor(
    private readonly gecko: GeckoTerminalClient,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async getChart(days: number): Promise<MarketChartPointDto[]> {
    const clamped = Math.min(Math.max(days, 1), 30);
    const cacheKey = `${CHART_CACHE_PREFIX}${clamped}`;
    const cached = await this.cache.get<MarketChartPointDto[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const rows = await this.gecko.fetchDailyChart(clamped);
      const points = rows.map((row) => ({
        date: row.date.toISOString().slice(0, 10),
        priceUsd: row.priceUsd,
      }));
      await this.cache.set(cacheKey, points, CHART_CACHE_TTL_MS);
      return points;
    } catch (error) {
      this.logger.warn(`WPGG chart fetch failed: ${String(error)}`);
      return [];
    }
  }

  async getLatestPriceUsd(): Promise<number> {
    const cached = await this.cache.get<number>(LATEST_CACHE_KEY);
    if (cached != null && Number.isFinite(cached)) {
      return cached;
    }

    const live = await this.gecko.fetchLatestPriceUsd();
    if (live != null) {
      await this.cache.set(LATEST_CACHE_KEY, live, LATEST_CACHE_TTL_MS);
      return live;
    }

    const chart = await this.getChart(1);
    const last = chart.at(-1)?.priceUsd;
    if (last != null && Number.isFinite(last)) {
      return last;
    }

    return 0;
  }
}
