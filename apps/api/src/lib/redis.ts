import Redis from 'ioredis';
import { env } from './env.js';

/**
 * Redis client singleton for caching and session management
 *
 * Uses Upstash Redis for:
 * - OAuth state token storage (CSRF protection)
 * - Session management
 * - Rate limiting
 */

class RedisService {
  private client: Redis | null = null;

  /**
   * Get or create Redis client instance
   */
  getClient(): Redis {
    if (!this.client) {
      this.client = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: false,
        lazyConnect: true, // Don't connect immediately
        // Upstash-specific settings
        tls: env.NODE_ENV === 'production' ? {} : undefined,
        // Disable reconnection in development when Redis is unavailable
        retryStrategy: (times: number) => {
          if (env.NODE_ENV !== 'production') {
            // In development, stop retrying after first failure
            return null;
          }
          // In production, retry with exponential backoff
          return Math.min(times * 50, 2000);
        },
      });

      this.client.on('error', (error: Error & { code?: string }) => {
        const errorCode = error.code;
        if (errorCode === 'ECONNREFUSED' && env.NODE_ENV !== 'production') {
          // Suppress connection refused errors in development (Redis optional)
          if (!(global as any).redisWarningShown) {
            console.warn('⚠️  Redis unavailable - background jobs and notifications disabled');
            console.warn('   To enable: brew services start redis (macOS) or docker run -p 6379:6379 redis');
            (global as any).redisWarningShown = true;
          }
          return;
        }
        console.error('Redis client error:', error);
      });

      this.client.on('connect', () => {
        console.log('✅ Redis client connected');
      });

      // Attempt to connect (will fail silently if unavailable in dev)
      if (env.NODE_ENV === 'production') {
        this.client.connect().catch(() => {
          // Ignore connection errors in production startup
        });
      } else {
        // In development, don't even attempt to connect if REDIS_URL is localhost
        if (!env.REDIS_URL.includes('localhost') && !env.REDIS_URL.includes('127.0.0.1')) {
          this.client.connect().catch(() => {
            // Ignore connection errors
          });
        }
      }
    }

    return this.client;
  }

  /**
   * Close Redis connection (for graceful shutdown)
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }
}

// Export singleton instance
const redisService = new RedisService();
export const redis = redisService.getClient();

// Export disconnect method for graceful shutdown
export const disconnectRedis = () => redisService.disconnect();
