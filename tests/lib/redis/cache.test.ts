import { describe, it, expect } from 'vitest';
import { ctxKey, respKey, jitterSeconds, hashMessages } from '@/lib/redis/cache';

describe('ctxKey', () => {
  it('formats conversation context key', () => {
    expect(ctxKey('c_123')).toBe('chat:ctx:c_123');
  });
});

describe('respKey', () => {
  it('prefixes hashed input with chat:resp', () => {
    const key = respKey('abc123');
    expect(key).toBe('chat:resp:abc123');
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
