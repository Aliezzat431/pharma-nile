import Redis from 'ioredis';

declare global {
  // eslint-disable-next-line no-var
  var redis: Redis | undefined;
}

let redisInstance: Redis | null = null;
let isRedisAvailable = false;

const redisUrl = process.env.REDIS_URL;
const redisHost = process.env.REDIS_HOST;
const redisPort = process.env.REDIS_PORT;
const redisPassword = process.env.REDIS_PASSWORD;

if (redisUrl || (redisHost && redisPort)) {
  try {
    const config = redisUrl
      ? redisUrl
      : {
          host: redisHost,
          port: Number(redisPort),
          password: redisPassword || undefined,
          lazyConnect: true,
          maxRetriesPerRequest: 2,
        };

    if (process.env.NODE_ENV === 'production') {
      redisInstance = new Redis(config as any);
    } else {
      if (!global.redis) {
        global.redis = new Redis(config as any);
      }
      redisInstance = global.redis;
    }

    if (redisInstance) {
      redisInstance.on('connect', () => {
        console.log('✅ Redis connected successfully.');
        isRedisAvailable = true;
      });

      redisInstance.on('error', (err) => {
        console.warn('⚠️ Redis error:', err.message);
        isRedisAvailable = false;
      });

      redisInstance.on('ready', () => {
        isRedisAvailable = true;
      });

      redisInstance.on('end', () => {
        isRedisAvailable = false;
      });

      // Try a silent background connection
      redisInstance.connect().catch((err) => {
        console.warn('⚠️ Failed to connect to Redis on startup. Running in fallback mode details:', err.message);
        isRedisAvailable = false;
      });
    }
  } catch (error) {
    console.error('❌ Redis Initialization Failed:', error);
    isRedisAvailable = false;
  }
} else {
  console.log('📝 Redis environment variables not configured. Caching and rate limiting will run in memory/fallback mode.');
}

export const redisClient = redisInstance;

export async function getCache<T>(key: string): Promise<T | null> {
  if (!redisInstance || !isRedisAvailable) return null;
  try {
    const data = await redisInstance.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (error) {
    console.warn(`Redis getCache failed for key ${key}:`, error);
    return null;
  }
}

export async function setCache(
  key: string,
  value: any,
  ttlSeconds?: number
): Promise<boolean> {
  if (!redisInstance || !isRedisAvailable) return false;
  try {
    const serialized = JSON.stringify(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await redisInstance.set(key, serialized, 'EX', ttlSeconds);
    } else {
      await redisInstance.set(key, serialized);
    }
    return true;
  } catch (error) {
    console.warn(`Redis setCache failed for key ${key}:`, error);
    return false;
  }
}

export async function delCache(key: string): Promise<boolean> {
  if (!redisInstance || !isRedisAvailable) return false;
  try {
    await redisInstance.del(key);
    return true;
  } catch (error) {
    console.warn(`Redis delCache failed for key ${key}:`, error);
    return false;
  }
}

export async function redisIncr(key: string, ttlSeconds?: number): Promise<number | null> {
  if (!redisInstance || !isRedisAvailable) return null;
  try {
    const multi = redisInstance.multi();
    multi.incr(key);
    if (ttlSeconds && ttlSeconds > 0) {
      multi.expire(key, ttlSeconds);
    }
    const results = await multi.exec();
    if (!results || results.length === 0) return null;
    const incrResult = results[0][1];
    return typeof incrResult === 'number' ? incrResult : Number(incrResult);
  } catch (error) {
    console.warn(`Redis incr failed for key ${key}:`, error);
    return null;
  }
}

export function isRedisActive(): boolean {
  return isRedisAvailable;
}
