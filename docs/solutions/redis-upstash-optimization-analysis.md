# Redis/Upstash Optimization Analysis

Comprehensive analysis of Redis usage across the agency-access-platform API to identify optimization opportunities for Upstash request limits.

**Date:** 2026-03-16

---

## 1. Architecture Overview

### Redis Consumers (in order of command volume)

| Consumer | Connection | Commands | Notes |
|----------|------------|----------|-------|
| **BullMQ** | Separate (bullMqConnectionOptions) | Highest | 8 queues, 8 workers, blocking polls |
| **Application Redis** | Singleton (redis.ts) | High | Cache, OAuth state, PKCE, ensureReady |
| **Rate limiting** | None | 0 | @fastify/rate-limit uses in-memory store (no Redis) |

### Connection Architecture

- **Main app:** `redis` singleton from `lib/redis.ts` (ioredis) — used by cache, OAuth state, PKCE, ensureRedisReady
- **BullMQ:** Separate ioredis connections via `bullMqConnectionOptions` (host/port/user/pass from parsed REDIS_URL)
- **Result:** 2+ connection pools. BullMQ creates its own connections per Queue/Worker; app uses one shared client.

---

## 2. BullMQ (Largest Contributor)

### Queues and Workers

| Queue | Worker | Concurrency | drainDelay | Started from index? |
|-------|--------|--------------|------------|---------------------|
| token-refresh | ✅ | 1 | 30 | ✅ |
| cleanup | ✅ | 1 | 30 | ✅ |
| notification | ✅ | 1 | 30 | ✅ |
| webhook-delivery | ✅ | 1 | 30 | ✅ |
| onboarding-email | ✅ | 1 | 30 | ✅ |
| trial-expiration | ✅ | 1 | 30 | ✅ |
| google-native-grant | ✅ | 1 | 30 | ✅ |
| authorization-verification | ✅ | 1 | 30 | ✅ |

### Findings

1. **authorization-verification worker lacks drainDelay** — Polls aggressively when idle.
2. **authorization-verification worker not started** — `index.ts` does not import or start it. Jobs may be queued but never processed (separate concern).
3. **Concurrency 5 on 4 workers** — token-refresh, notification, webhook-delivery, google-native-grant. Each can issue up to 5 concurrent Redis ops. Consider reducing to 3 for low-traffic.
4. **Recurring jobs** — Already optimized: token refresh 12h, cleanup/trial daily.

---

## 3. Application Redis (cache, OAuth, PKCE)

### Cache Layer (`lib/cache.ts`)

- **getCached:** 1 GET on hit, 1 GET + 1 SET on miss (2 commands per miss)
- **invalidateCache:** SCAN + DEL (already optimized; was KEYS, now scanStream)
- **deleteCache:** 1 DEL

**Call sites:**

- Dashboard: `getCached` with `CacheKeys.dashboard(agencyId)` (TTL 300s)
- Agency list: `getCached` with `CacheKeys.agencyConnections(agencyId)` (TTL 300s)
- Agency resolution: `getCached` with `CacheKeys.agencyByClerkId`, `agencyByEmail` (TTL 300s)
- Invalidation: `invalidateCache('dashboard:${agencyId}:*')` + `deleteCache(CacheKeys.agencyConnections(...))` on connection changes

**Potential issue:** Pattern `dashboard:${agencyId}:*` does NOT match `dashboard:${agencyId}` (the main dashboard key). So the root dashboard key can remain stale after invalidation. Consider:
- `invalidateCache('dashboard:${agencyId}*')` (no colon before *) to match both, or
- Add `deleteCache(CacheKeys.dashboard(agencyId))` alongside invalidateCache.

### OAuth State Service (`oauth-state.service.ts`)

- **createState:** 1 SET
- **validateState (Redis-backed):** 1 GET + 1 DEL
- **Fallback:** Stateless token when Redis fails (no Redis used)

### PKCE (`lib/pkce.ts`)

- **storeCodeVerifier:** 1 SETEX
- **getCodeVerifier:** 1 GET
- **deleteCodeVerifier:** 1 DEL
- **Dynamic import** — Uses `await import('@/lib/redis.js')` on every call. Minor overhead; could use top-level import.

### ensureRedisReady (`lib/redis.ts`)

- Called once at production startup
- Issues: PING, SET (probe), GET (verify), DEL (cleanup) = 4 commands per boot

---

## 4. Double Invalidation Pattern

Many flows call both:

```ts
deleteCache(CacheKeys.agencyConnections(agencyId));
invalidateCache(`dashboard:${agencyId}:*`);
```

- `deleteCache` = 1 DEL
- `invalidateCache` = SCAN (N iterations) + 1 DEL per matched key

**Optimization:** If `dashboard:${agencyId}:*` typically matches few keys (e.g. stats, requests, connections), this is fine. If the pattern is broad, consider consolidating to a single invalidation strategy.

---

## 5. Optimization Recommendations

### High Impact (implement soon)

| # | Change | Est. savings |
|---|--------|--------------|
| 1 | Add `drainDelay: 30` to authorization-verification worker | Cuts idle polling when queue empty |
| 2 | Start authorization-verification worker from index.ts (if intended) | Ensures jobs run; then (1) applies |
| 3 | Fix dashboard invalidation — include `dashboard:${agencyId}` | Correctness; avoids stale dashboard |

### Medium Impact

| # | Change | Est. savings |
|---|--------|--------------|
| 4 | Reduce worker concurrency from 5 to 3 (notification, webhook-delivery, google-native-grant) | Fewer concurrent Redis ops during bursts |
| 5 | PKCE: Use top-level `import { redis }` instead of dynamic import | Tiny; reduces module load per call |

### Low Impact / Already Done

- ✅ drainDelay on 7 workers
- ✅ Token refresh 12h
- ✅ scheduleJobs reuses queues
- ✅ invalidateCache uses SCAN not KEYS
- ✅ Rate limit uses in-memory (no Redis)

---

## 6. Connection Reuse (Cancelled Previously)

BullMQ v5 does not share a single connection with the main app redis client the way legacy Bull did. Each Queue/Worker creates its own connection pool. Attempts to pass a shared ioredis instance can cause issues. **No change recommended** for connection reuse.

---

## 7. Cache TTL and Hit Rate

- Default TTL: 300s (5 min) for dashboard, agency, connections
- **CacheStats** exists but is never used — no recording of hits/misses
- Recommendation: Either wire CacheStats into getCached for observability, or remove it to avoid dead code

---

## 8. Clerk Metadata Service

Comment says "Returns cached result if available (Redis)" but `getSubscriptionTier` does not use Redis — it calls Clerk directly. **Remove or correct the comment.**

---

## 9. Summary Checklist

- [ ] Add drainDelay to authorization-verification worker
- [ ] Start authorization-verification worker from index.ts (if jobs should run)
- [ ] Fix dashboard cache invalidation to include root key
- [ ] Consider reducing concurrency on notification/webhook/google-native-grant workers
- [ ] PKCE: Prefer top-level redis import
- [ ] Clerk-metadata: Fix misleading Redis comment
- [ ] CacheStats: Use or remove

---

## 10. Estimated Command Reduction

Assuming current optimizations (drainDelay, 12h token refresh, SCAN) are deployed:

| Source | Before est. | After est. |
|--------|-------------|------------|
| BullMQ workers (idle) | ~120K/day | ~20K/day |
| Token refresh cron | ~240/month | ~60/month |
| Cache/OAuth/PKCE | User-driven | Unchanged |
| **Total (low-traffic)** | ~500K/month | ~100–200K/month |

Add authorization-verification drainDelay and concurrency cuts for further savings.

---

## 11. Zero-Traffic Baseline (2026-03-17)

**Observed:** ~846K Redis commands/day with zero users, only manual testing.

**Root cause:** BullMQ workers poll Redis continuously even when queues are empty. Upstash docs: "BullMQ accesses Redis regularly, even when there is no queue activity."

**Fix implemented:** `BULLMQ_WORKERS_ENABLED` env var (default: true).

| BULLMQ_WORKERS_ENABLED | Workers | Concurrency | Est. Redis/day |
|------------------------|---------|--------------|----------------|
| `true` (default) | 8 workers | 1 each (8 slots) | ~250–300K (idle polling) |
| `false` | None | — | ~100–1K (startup + request-driven only) |

**When to use `false`:** Pre-launch, staging, or any environment with zero/minimal traffic. OAuth, cache, and API work normally; token refresh, notifications, webhooks, onboarding emails, cleanup, trial expiration, and authorization verification will queue but not process.

**Production:** Set `BULLMQ_WORKERS_ENABLED=true` (or omit; default) before launch.

**Concurrency:** All workers use `concurrency: 1` to minimize Redis usage. Increase (e.g. token-refresh to 3–5, notification/webhook to 2–3) when traffic justifies.
