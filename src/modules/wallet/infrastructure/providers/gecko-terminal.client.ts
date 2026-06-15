import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import {
  GECKO_TERMINAL_API_BASE,
  WPGG_GECKO_NETWORK,
  WPGG_POLYGON_POOL_ADDRESS,
} from '../../domain/wpgg-token.constants';

export type GeckoMarketChartPoint = {
  date: Date;
  priceUsd: number;
};

type OhlcvRow = [number, number, number, number, number, number];

@Injectable()
export class GeckoTerminalClient {
  private readonly logger = new Logger(GeckoTerminalClient.name);

  private poolUrl(path: string) {
    return `${GECKO_TERMINAL_API_BASE}/networks/${WPGG_GECKO_NETWORK}/pools/${WPGG_POLYGON_POOL_ADDRESS}${path}`;
  }

  async fetchDailyChart(limit: number): Promise<GeckoMarketChartPoint[]> {
    const { data } = await axios.get<{
      data?: { attributes?: { ohlcv_list?: OhlcvRow[] } };
    }>(this.poolUrl('/ohlcv/day'), {
      params: {
        aggregate: 1,
        limit,
        currency: 'usd',
      },
      timeout: 15_000,
      headers: { accept: 'application/json' },
    });

    const rows = data.data?.attributes?.ohlcv_list ?? [];
    return rows
      .map((row) => ({
        date: new Date(row[0] * 1000),
        priceUsd: row[4],
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async fetchLatestPriceUsd(): Promise<number | null> {
    try {
      const { data } = await axios.get<{
        data?: { attributes?: { base_token_price_usd?: string | number } };
      }>(this.poolUrl(''), {
        timeout: 15_000,
        headers: { accept: 'application/json' },
      });
      const raw = data.data?.attributes?.base_token_price_usd;
      if (raw == null) {
        return null;
      }
      const price = Number(raw);
      return Number.isFinite(price) ? price : null;
    } catch (error) {
      this.logger.warn(`GeckoTerminal pool price failed: ${String(error)}`);
      return null;
    }
  }
}
