import { Ratelimit } from '@upstash/ratelimit';
import { createHash } from 'node:crypto';
import { redis } from '@/lib/redis';

function hashId(id: string): string {
  return createHash('sha256').update(id).digest('hex').slice(0, 8);
}

export const perMinuteLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  prefix: 'rl:chat:min',
  analytics: false,
});

export const perDayLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 d'),
  prefix: 'rl:chat:day',
  analytics: false,
});

export type LimitResult =
  | { ok: true }
  | {
      ok: false;
      which: 'min' | 'day' | 'error';
      /** Unix epoch ms when the window resets. Convert for HTTP Retry-After via `Math.ceil((reset - Date.now()) / 1000)`. */
      reset: number;
    };

/**
 * Check per-user chat rate limit. Serial check: min fails short-circuits
 * day so day quota is not consumed.
 *
 * Fail-closed policy: if Redis is unreachable, denies the request with
 * `which: 'error'` and a 60s backoff. Rationale: prevents bypassing cost
 * controls during transient Upstash outages.
 */
export async function checkChatLimit(userId: string): Promise<LimitResult> {
  if (!userId) {
    throw new Error('checkChatLimit: userId is required');
  }
  try {
    const min = await perMinuteLimiter.limit(userId);
    if (!min.success) {
      console.warn('[ratelimit] min denied', { userId: hashId(userId), reset: min.reset });
      return { ok: false, which: 'min', reset: min.reset };
    }
    const day = await perDayLimiter.limit(userId);
    if (!day.success) {
      console.warn('[ratelimit] day denied', { userId: hashId(userId), reset: day.reset });
      return { ok: false, which: 'day', reset: day.reset };
    }
    return { ok: true };
  } catch (err) {
    console.error('[ratelimit] upstream error', { userId: hashId(userId), err });
    return { ok: false, which: 'error', reset: Date.now() + 60_000 };
  }
}
