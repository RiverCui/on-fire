import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks must be hoisted because vi.mock is hoisted to the top of the file
// before any top-level const initializers run.
const { redisMock, fetchNetWorthTrend } = vi.hoisted(() => ({
  redisMock: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
  fetchNetWorthTrend: vi.fn(),
}));

vi.mock('@/lib/redis', () => ({ redis: redisMock }));
vi.mock('@/lib/data', () => ({ fetchNetWorthTrend }));

import {
  getCachedNetWorthTrend,
  invalidateNetWorthTrend,
} from '@/lib/redis/asset-trend-cache';
import { trendKey, trendLockKey } from '@/lib/redis/cache';

const USER = 'u_demo';

beforeEach(() => {
  vi.clearAllMocks();
  redisMock.get.mockReset();
  redisMock.set.mockReset();
  redisMock.del.mockReset();
  fetchNetWorthTrend.mockReset();
});

describe('getCachedNetWorthTrend — cache hit', () => {
  it('returns cached data and never queries DB', async () => {
    const cached = [{ date: '2026-04-01', total: 100 }];
    redisMock.get.mockResolvedValueOnce(cached);

    const result = await getCachedNetWorthTrend(USER, '1Y');

    expect(result).toEqual(cached);
    expect(fetchNetWorthTrend).not.toHaveBeenCalled();
    expect(redisMock.set).not.toHaveBeenCalled();
    expect(redisMock.get).toHaveBeenCalledWith(trendKey(USER, '1Y'));
  });
});

describe('getCachedNetWorthTrend — cache miss + lock acquired', () => {
  it('queries DB, writes cache with jittered TTL, releases lock', async () => {
    redisMock.get.mockResolvedValueOnce(null); // probe miss
    redisMock.set.mockResolvedValueOnce('OK'); // lock acquired
    fetchNetWorthTrend.mockResolvedValueOnce([
      { date: '2026-04-29', total: 1000 },
    ]);
    redisMock.set.mockResolvedValueOnce('OK'); // cache write
    redisMock.del.mockResolvedValueOnce(1); // lock release

    const result = await getCachedNetWorthTrend(USER, '1Y');

    expect(result).toHaveLength(1);
    expect(fetchNetWorthTrend).toHaveBeenCalledWith(USER, '1Y');

    // First set call = SET NX EX for lock
    expect(redisMock.set).toHaveBeenNthCalledWith(
      1,
      trendLockKey(USER, '1Y'),
      '1',
      { nx: true, ex: 30 },
    );

    // Second set call = cache write with TTL near 600s (±10% jitter)
    const writeCall = redisMock.set.mock.calls[1];
    expect(writeCall[0]).toBe(trendKey(USER, '1Y'));
    expect(writeCall[2]?.ex).toBeGreaterThanOrEqual(540);
    expect(writeCall[2]?.ex).toBeLessThanOrEqual(660);

    expect(redisMock.del).toHaveBeenCalledWith(trendLockKey(USER, '1Y'));
  });

  it('caches empty result with the shorter penetration TTL', async () => {
    redisMock.get.mockResolvedValueOnce(null);
    redisMock.set.mockResolvedValueOnce('OK');
    fetchNetWorthTrend.mockResolvedValueOnce([]); // empty
    redisMock.set.mockResolvedValueOnce('OK');
    redisMock.del.mockResolvedValueOnce(1);

    await getCachedNetWorthTrend(USER, '6M');

    const writeCall = redisMock.set.mock.calls[1];
    expect(writeCall[0]).toBe(trendKey(USER, '6M'));
    // TTL_EMPTY = 60s ± 10% → [54, 66]
    expect(writeCall[2]?.ex).toBeGreaterThanOrEqual(54);
    expect(writeCall[2]?.ex).toBeLessThanOrEqual(66);
  });
});

describe('getCachedNetWorthTrend — cache miss + lock contention', () => {
  it('returns retried cache hit without querying DB', async () => {
    redisMock.get.mockResolvedValueOnce(null); // initial probe miss
    redisMock.set.mockResolvedValueOnce(null); // SET NX failed (someone else holds lock)
    redisMock.get.mockResolvedValueOnce([
      { date: '2026-04-29', total: 999 }, // lock holder published while we waited
    ]);

    const result = await getCachedNetWorthTrend(USER, '3M');

    expect(result).toEqual([{ date: '2026-04-29', total: 999 }]);
    expect(fetchNetWorthTrend).not.toHaveBeenCalled();
    expect(redisMock.del).not.toHaveBeenCalled(); // we never held the lock
  });

  it('falls through to DB when retry still misses (degraded path)', async () => {
    redisMock.get.mockResolvedValueOnce(null); // probe miss
    redisMock.set.mockResolvedValueOnce(null); // SET NX failed
    redisMock.get.mockResolvedValueOnce(null); // retry still miss
    fetchNetWorthTrend.mockResolvedValueOnce([
      { date: '2026-04-29', total: 555 },
    ]);

    const result = await getCachedNetWorthTrend(USER, '1M');

    expect(result).toEqual([{ date: '2026-04-29', total: 555 }]);
    // Critical: we did NOT write to cache (lock holder is responsible)
    expect(redisMock.set).toHaveBeenCalledTimes(1); // only the failed SET NX
  });
});

describe('invalidateNetWorthTrend', () => {
  it('deletes every range key', async () => {
    redisMock.del.mockResolvedValue(1);

    await invalidateNetWorthTrend(USER);

    expect(redisMock.del).toHaveBeenCalledTimes(4);
    expect(redisMock.del).toHaveBeenCalledWith(trendKey(USER, '1M'));
    expect(redisMock.del).toHaveBeenCalledWith(trendKey(USER, '3M'));
    expect(redisMock.del).toHaveBeenCalledWith(trendKey(USER, '6M'));
    expect(redisMock.del).toHaveBeenCalledWith(trendKey(USER, '1Y'));
  });

  it('swallows redis errors so a failed cache delete does not break writes', async () => {
    redisMock.del.mockRejectedValue(new Error('redis down'));

    await expect(invalidateNetWorthTrend(USER)).resolves.toBeUndefined();
  });
});
