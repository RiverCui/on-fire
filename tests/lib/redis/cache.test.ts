import { describe, it, expect, vi, beforeEach } from 'vitest';

const { redisMock } = vi.hoisted(() => ({
  redisMock: {
    set: vi.fn(),
    del: vi.fn(),
  },
}));

vi.mock('@/lib/redis', () => ({ redis: redisMock }));

import {
  ctxKey,
  respKey,
  trendKey,
  trendLockKey,
  jitterSeconds,
  hashMessages,
  tryAcquireLock,
  releaseLock,
} from '@/lib/redis/cache';

beforeEach(() => {
  redisMock.set.mockReset();
  redisMock.del.mockReset();
});

describe('ctxKey', () => {
  it('formats conversation context key', () => {
    expect(ctxKey('c_123')).toBe('chat:ctx:c_123');
  });
});

describe('respKey', () => {
  it('prefixes hashed input with chat:resp', () => {
    expect(respKey('abc123')).toBe('chat:resp:abc123');
  });
});

describe('trendKey / trendLockKey', () => {
  it('keeps user and range in the namespace', () => {
    expect(trendKey('u1', '1Y')).toBe('assets:trend:u1:1Y');
    expect(trendLockKey('u1', '1Y')).toBe('assets:trend:lock:u1:1Y');
  });
});

describe('jitterSeconds', () => {
  it('stays within +/- 10% of base', () => {
    for (let i = 0; i < 100; i++) {
      const v = jitterSeconds(3600);
      expect(v).toBeGreaterThanOrEqual(3240);
      expect(v).toBeLessThanOrEqual(3960);
      expect(Number.isInteger(v)).toBe(true);
    }
  });
});

describe('hashMessages', () => {
  it('produces stable sha256 hex for identical input', () => {
    const a = hashMessages([{ role: 'user', content: 'hi' }]);
    const b = hashMessages([{ role: 'user', content: 'hi' }]);
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it('changes when content changes', () => {
    const a = hashMessages([{ role: 'user', content: 'hi' }]);
    const b = hashMessages([{ role: 'user', content: 'bye' }]);
    expect(a).not.toBe(b);
  });
});

describe('tryAcquireLock', () => {
  it('returns true when SET NX succeeds (we hold the lock)', async () => {
    redisMock.set.mockResolvedValueOnce('OK');

    const acquired = await tryAcquireLock('lock:foo', 30);

    expect(acquired).toBe(true);
    expect(redisMock.set).toHaveBeenCalledWith('lock:foo', '1', {
      nx: true,
      ex: 30,
    });
  });

  it('returns false when SET NX fails (someone else holds it)', async () => {
    redisMock.set.mockResolvedValueOnce(null);

    const acquired = await tryAcquireLock('lock:foo', 30);

    expect(acquired).toBe(false);
  });
});

describe('releaseLock', () => {
  it('deletes the lock key', async () => {
    redisMock.del.mockResolvedValueOnce(1);

    await releaseLock('lock:foo');

    expect(redisMock.del).toHaveBeenCalledWith('lock:foo');
  });

  it('swallows redis errors so a failed release does not crash callers', async () => {
    redisMock.del.mockRejectedValueOnce(new Error('redis down'));

    await expect(releaseLock('lock:foo')).resolves.toBeUndefined();
  });
});
