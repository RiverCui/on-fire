import { createHash } from 'node:crypto';
import { redis } from '@/lib/redis';

export const ctxKey = (conversationId: string) => `chat:ctx:${conversationId}`;
export const respKey = (hash: string) => `chat:resp:${hash}`;
export const trendKey = (userId: string, range: string) =>
  `assets:trend:${userId}:${range}`;
export const trendLockKey = (userId: string, range: string) =>
  `assets:trend:lock:${userId}:${range}`;

/**
 * Acquire a short-lived Redis lock via SET NX EX.
 * Returns true iff the lock was newly created (we hold it).
 *
 * Used to defend against cache breakdown: when a hot key expires and many
 * concurrent requests miss simultaneously, only one request proceeds to
 * recompute. Others wait briefly and re-read the cache.
 */
export async function tryAcquireLock(
  key: string,
  ttlSec: number,
): Promise<boolean> {
  const result = await redis.set(key, '1', { nx: true, ex: ttlSec });
  return result === 'OK';
}

export async function releaseLock(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (err) {
    console.warn('[cache] releaseLock failed', { key, err });
  }
}

/** +/- 10% jitter on TTL to smear cache expirations. */
export function jitterSeconds(baseSeconds: number): number {
  const range = baseSeconds * 0.1;
  const delta = Math.floor(Math.random() * range * 2) - Math.floor(range);
  return baseSeconds + delta;
}

/**
 * Stable SHA-256 of messages for response-cache keys.
 * NOTE: callers must pass objects with `{ role, content }` in that property
 * order — JSON.stringify preserves insertion order, and the hash depends on it.
 */
export function hashMessages(
  messages: Array<{ role: string; content: string }>,
): string {
  const json = JSON.stringify(messages);
  return createHash('sha256').update(json).digest('hex');
}
