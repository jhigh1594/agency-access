/**
 * Performance Monitoring Middleware
 *
 * Tracks response times and cache hit rates for monitoring and optimization.
 * Logs slow requests and adds performance headers to responses.
 */

import { FastifyRequest, FastifyReply, onRequestHookHandler } from 'fastify';

// Performance metrics
interface PerformanceMetrics {
  requests: number;
  slowRequests: number;
  cacheHits: number;
  cacheMisses: number;
  totalResponseTime: number;
}

const metrics: PerformanceMetrics = {
  requests: 0,
  slowRequests: 0,
  cacheHits: 0,
  cacheMisses: 0,
  totalResponseTime: 0,
};

// Performance threshold (ms) - log warnings for requests slower than this
const SLOW_REQUEST_THRESHOLD = 500;

// Store request start times
const requestStartTimes = new WeakMap<FastifyRequest, number>();

/**
 * Performance monitoring middleware factory
 */
export const performanceMiddleware: onRequestHookHandler = async (request, reply) => {
  // Store start time
  requestStartTimes.set(request, Date.now());

  // Hook into onSend to capture response time
  reply.raw.on('finish', () => {
    const startTime = requestStartTimes.get(request);
    if (!startTime) return;

    const duration = Date.now() - startTime;

    // Update metrics
    metrics.requests++;
    metrics.totalResponseTime += duration;

    // Track cache hits/misses from X-Cache header
    const cacheStatus = reply.getHeader('X-Cache');
    if (cacheStatus === 'HIT') {
      metrics.cacheHits++;
    } else if (cacheStatus === 'MISS') {
      metrics.cacheMisses++;
    }

    // Log slow requests
    if (duration > SLOW_REQUEST_THRESHOLD) {
      metrics.slowRequests++;
      request.log.warn({
        method: request.method,
        url: request.url,
        duration: `${duration}ms`,
        threshold: `${SLOW_REQUEST_THRESHOLD}ms`,
      }, '⚠️  Slow request detected');
    }

    // Add performance headers
    reply.header('X-Response-Time', `${duration}ms`);

    // Add cache hit rate header (percentage)
    const totalCacheRequests = metrics.cacheHits + metrics.cacheMisses;
    if (totalCacheRequests > 0) {
      const hitRate = (metrics.cacheHits / totalCacheRequests) * 100;
      reply.header('X-Cache-Hit-Rate', `${hitRate.toFixed(1)}%`);
    }
  });
};

/**
 * Get current performance metrics
 */
export function getPerformanceMetrics(): PerformanceMetrics {
  return { ...metrics };
}

/**
 * Get performance statistics (averages and rates)
 */
export function getPerformanceStats() {
  const avgResponseTime = metrics.requests > 0 ? metrics.totalResponseTime / metrics.requests : 0;
  const slowRequestRate = metrics.requests > 0 ? (metrics.slowRequests / metrics.requests) * 100 : 0;
  const totalCacheRequests = metrics.cacheHits + metrics.cacheMisses;
  const cacheHitRate = totalCacheRequests > 0 ? (metrics.cacheHits / totalCacheRequests) * 100 : 0;

  return {
    totalRequests: metrics.requests,
    slowRequests: metrics.slowRequests,
    avgResponseTime: Math.round(avgResponseTime),
    slowRequestRate: parseFloat(slowRequestRate.toFixed(1)),
    cacheHitRate: parseFloat(cacheHitRate.toFixed(1)),
    cacheHits: metrics.cacheHits,
    cacheMisses: metrics.cacheMisses,
  };
}

/**
 * Reset metrics (useful for testing or periodic resets)
 */
export function resetPerformanceMetrics(): void {
  metrics.requests = 0;
  metrics.slowRequests = 0;
  metrics.cacheHits = 0;
  metrics.cacheMisses = 0;
  metrics.totalResponseTime = 0;
}

/**
 * Log performance summary
 */
export function logPerformanceSummary(): void {
  const stats = getPerformanceStats();

  console.log('📊 Performance Summary:');
  console.log(`   Total Requests: ${stats.totalRequests}`);
  console.log(`   Avg Response Time: ${stats.avgResponseTime}ms`);
  console.log(`   Slow Requests (>${SLOW_REQUEST_THRESHOLD}ms): ${stats.slowRequests} (${stats.slowRequestRate}%)`);
  console.log(`   Cache Hit Rate: ${stats.cacheHitRate}% (${stats.cacheHits} hits / ${stats.cacheHits + stats.cacheMisses} total)`);
}
