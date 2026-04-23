import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/lib/redis';

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

/**
 * Serial: min fails short-circuits day so day quota is not consumed.
 */
export async function checkChatLimit(userId: string): Promise<
  | { ok: true }
  | { ok: false; which: 'min' | 'day'; reset: number }
> {
  const min = await perMinuteLimiter.limit(userId);
  if (!min.success) return { ok: false, which: 'min', reset: min.reset };
  const day = await perDayLimiter.limit(userId);
  if (!day.success) return { ok: false, which: 'day', reset: day.reset };
  return { ok: true };
}
