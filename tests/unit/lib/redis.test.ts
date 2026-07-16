import { getCache, setCache, delCache, redisIncr, isRedisActive } from '@/lib/redis';
import Redis from 'ioredis';

jest.mock('ioredis');

describe('Redis Wrapper Utilities', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('should default to fallback mode if no Redis env vars are defined', () => {
    delete process.env.REDIS_URL;
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;

    expect(isRedisActive()).toBe(false);
  });

  test('getCache should return null if Redis is inactive', async () => {
    const result = await getCache('any-key');
    expect(result).toBeNull();
  });

  test('setCache should return false if Redis is inactive', async () => {
    const result = await setCache('any-key', 'any-value');
    expect(result).toBe(false);
  });

  test('delCache should return false if Redis is inactive', async () => {
    const result = await delCache('any-key');
    expect(result).toBe(false);
  });

  test('redisIncr should return null if Redis is inactive', async () => {
    const result = await redisIncr('any-key');
    expect(result).toBeNull();
  });
});
