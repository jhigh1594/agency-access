/**
 * Performance Monitoring Middleware
 *
 * Tracks response times and cache hit rates for monitoring and optimization.
 * Logs slow requests and adds performance headers to responses.
 */

import {
  FastifyRequest,
  FastifyReply,
  onRequestHookHandler,
  onSendHookHandler,
} from 'fastify';

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

interface RequestPerformanceContext {
  startedAtMs: number;
  marks: Map<string, number>;
}

const REQUEST_PERFORMANCE_CONTEXT = Symbol('request-performance-context');

function getPerformanceContext(request: FastifyRequest): RequestPerformanceContext | undefined {
  return (request as any)[REQUEST_PERFORMANCE_CONTEXT] as RequestPerformanceContext | undefined;
}

function formatServerTimingEntry(name: string, durationMs: number): string {
  return `${name};dur=${durationMs.toFixed(2)}`;
}

/**
 * Record a named duration for the active request.
 * Dashboard route uses this to expose detailed server-timing spans.
 */
export function recordPerformanceMark(
  request: FastifyRequest,
  name: string,
  durationMs: number
): void {
  const context = getPerformanceContext(request);
  if (!context) return;
  context.marks.set(name, Math.max(0, durationMs));
}

/**
 * Performance monitoring middleware factory
 */
export const performanceOnRequest: onRequestHookHandler = async (request) => {
  (request as any)[REQUEST_PERFORMANCE_CONTEXT] = {
    startedAtMs: Date.now(),
    marks: new Map<string, number>(),
  } satisfies RequestPerformanceContext;
};

/**
 * Response hook for performance headers and aggregate counters.
 * onSend runs before headers are sent, so response-time headers are reliable.
 */
export const performanceOnSend: onSendHookHandler = async (request, reply, payload) => {
  const context = getPerformanceContext(request);
  if (!context) {
    return payload;
  }

  const duration = Date.now() - context.startedAtMs;

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

  const markEntries: string[] = [];
  markEntries.push(formatServerTimingEntry('total', duration));
  for (const [name, markDuration] of context.marks.entries()) {
    markEntries.push(formatServerTimingEntry(name, markDuration));
  }

  const existingServerTiming = reply.getHeader('Server-Timing');
  const existingValue = typeof existingServerTiming === 'string' ? existingServerTiming : '';
  const computedValue = markEntries.join(', ');
  reply.header('Server-Timing', existingValue ? `${existingValue}, ${computedValue}` : computedValue);

  return payload;
};

// Backward-compatible alias while moving index.ts to explicit onRequest/onSend hooks.
export const performanceMiddleware = performanceOnRequest;

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
