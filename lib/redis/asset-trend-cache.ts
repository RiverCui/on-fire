import { redis } from '@/lib/redis';
import {
  jitterSeconds,
  releaseLock,
  trendKey,
  trendLockKey,
  tryAcquireLock,
} from '@/lib/redis/cache';
import { fetchNetWorthTrend, type TrendRange } from '@/lib/data';

export type NetWorthPoint = { date: string; total: number };

const ALL_RANGES: TrendRange[] = ['1M', '3M', '6M', '1Y'];

// TTLs (seconds) — base values, fed through jitterSeconds() at write time.
const TTL_OK = 600; // 10 min for non-empty results
const TTL_EMPTY = 60; // 1 min for empty arrays (penetration defense — short so new users see fresh data quickly)
const TTL_LOCK = 30; // 30s lock window — generous to outlive a slow query
const LOCK_RETRY_MS = 200; // wait before re-checking cache after a lock miss

/**
 * Cached net-worth trend with three-layer Redis protection:
 *
 * - Avalanche: TTL is jittered ±10% so multiple ranges loaded together
 *   on dashboard mount don't all expire on the same tick.
 * - Breakdown: SET NX lock so cold-start / post-invalidation thundering
 *   herds funnel into a single DB query; concurrent requests retry the
 *   cache after a brief sleep instead of piling onto Postgres.
 * - Penetration: empty results are still cached (with a shorter TTL) so
 *   new users with zero asset records don't replay the join+groupBy
 *   on every dashboard load.
 */
export async function getCachedNetWorthTrend(
  userId: string,
  range: TrendRange,
): Promise<NetWorthPoint[]> {
  const key = trendKey(userId, range);
  const lockKey = trendLockKey(userId, range);

  // 1. Probe cache (single source of truth for both populated and empty results).
  const hit = await safeGet(key);
  if (hit) return hit;

  // 2. Try to acquire the recompute lock.
  const acquired = await tryAcquireLock(lockKey, TTL_LOCK).catch((err) => {
    console.warn('[asset-trend-cache] lock failed', { userId, range, err });
    return false; // fall through to DB; better stale-DB than 500
  });

  if (!acquired) {
    // Another request is already recomputing. Brief wait, then re-check cache.
    await sleep(LOCK_RETRY_MS);
    const retry = await safeGet(key);
    if (retry) return retry;
    // Lock holder hasn't published yet (or died). Degrade to a direct DB read,
    // but skip the cache write to avoid clobbering the lock holder's response.
    return fetchNetWorthTrend(userId, range);
  }

  try {
    const data = await fetchNetWorthTrend(userId, range);
    const isEmpty = data.length === 0;
    const ttl = jitterSeconds(isEmpty ? TTL_EMPTY : TTL_OK);
    try {
      await redis.set(key, data, { ex: ttl });
    } catch (err) {
      console.warn('[asset-trend-cache] write failed', { userId, range, err });
    }
    return data;
  } finally {
    await releaseLock(lockKey);
  }
}

/**
 * Drop every range's cached trend for a user. Call after any mutation that
 * could shift historical balances: AssetAccount create/update/delete or
 * AssetRecord create/update/delete.
 */
export async function invalidateNetWorthTrend(userId: string): Promise<void> {
  await Promise.all(
    ALL_RANGES.map((range) =>
      redis.del(trendKey(userId, range)).catch((err) => {
        console.warn('[asset-trend-cache] invalidate failed', {
          userId,
          range,
          err,
        });
      }),
    ),
  );
}

async function safeGet(key: string): Promise<NetWorthPoint[] | null> {
  try {
    return await redis.get<NetWorthPoint[]>(key);
  } catch (err) {
    console.warn('[asset-trend-cache] read failed', { key, err });
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
