import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

@Injectable()
export class RedisLockService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async tryAcquire(key: string, ttlSec: number): Promise<boolean> {
    const result = await this.redis.set(key, '1', 'EX', ttlSec, 'NX');
    return result === 'OK';
  }
}
