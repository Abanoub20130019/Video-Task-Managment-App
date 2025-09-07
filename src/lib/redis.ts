import Redis from 'ioredis';

let redis: Redis | null = null;

// Initialize Redis connection
function getRedisClient(): Redis | null {
  if (!process.env.REDIS_URL) {
    console.warn('Redis URL not configured, caching disabled');
    return null;
  }

  if (!redis) {
    try {
      redis = new Redis(process.env.REDIS_URL, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      redis.on('error', (error) => {
        console.error('Redis connection error:', error);
      });

      redis.on('connect', () => {
        console.log('Connected to Redis successfully');
      });
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      return null;
    }
  }

  return redis;
}

// Cache utility functions
export class CacheService {
  private static client = getRedisClient();

  // Get cached data
  static async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;

    try {
      const cached = await this.client.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  // Set cached data with TTL (time to live in seconds)
  static async set(key: string, data: any, ttl: number = 300): Promise<boolean> {
    if (!this.client) return false;

    try {
      await this.client.setex(key, ttl, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  // Delete cached data
  static async del(key: string): Promise<boolean> {
    if (!this.client) return false;

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis del error:', error);
      return false;
    }
  }

  // Delete multiple keys by pattern
  static async delPattern(pattern: string): Promise<boolean> {
    if (!this.client) return false;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('Redis delPattern error:', error);
      return false;
    }
  }

  // Check if key exists
  static async exists(key: string): Promise<boolean> {
    if (!this.client) return false;

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  // Get or set pattern - if data doesn't exist, fetch it and cache it
  static async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl: number = 300
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // If not in cache, fetch the data
    const data = await fetchFunction();
    
    // Cache the result
    await this.set(key, data, ttl);
    
    return data;
  }

  // Increment a counter
  static async incr(key: string, ttl?: number): Promise<number> {
    if (!this.client) return 0;

    try {
      const result = await this.client.incr(key);
      if (ttl && result === 1) {
        // Set TTL only on first increment
        await this.client.expire(key, ttl);
      }
      return result;
    } catch (error) {
      console.error('Redis incr error:', error);
      return 0;
    }
  }

  // Get TTL of a key
  static async ttl(key: string): Promise<number> {
    if (!this.client) return -1;

    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error('Redis ttl error:', error);
      return -1;
    }
  }
}

// Cache key generators
export const CacheKeys = {
  dashboardStats: (userId?: string) => `dashboard:stats${userId ? `:${userId}` : ''}`,
  projectList: (page: number, limit: number, filters?: string) => 
    `projects:list:${page}:${limit}${filters ? `:${filters}` : ''}`,
  taskList: (projectId?: string, page?: number, limit?: number, filters?: string) => 
    `tasks:list${projectId ? `:${projectId}` : ''}${page ? `:${page}` : ''}${limit ? `:${limit}` : ''}${filters ? `:${filters}` : ''}`,
  userList: (page: number, limit: number, filters?: string) => 
    `users:list:${page}:${limit}${filters ? `:${filters}` : ''}`,
  project: (id: string) => `project:${id}`,
  task: (id: string) => `task:${id}`,
  user: (id: string) => `user:${id}`,
  rateLimitAuth: (ip: string) => `rate_limit:auth:${ip}`,
  rateLimitApi: (ip: string, endpoint: string) => `rate_limit:api:${ip}:${endpoint}`,
};

// Cache TTL constants (in seconds)
export const CacheTTL = {
  DASHBOARD_STATS: 300, // 5 minutes
  PROJECT_LIST: 600, // 10 minutes
  TASK_LIST: 300, // 5 minutes
  USER_LIST: 900, // 15 minutes
  SINGLE_ITEM: 1800, // 30 minutes
  RATE_LIMIT_AUTH: 900, // 15 minutes
  RATE_LIMIT_API: 3600, // 1 hour
};

export default CacheService;