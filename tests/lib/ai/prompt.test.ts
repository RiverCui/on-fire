import { describe, it, expect } from 'vitest';
import { SYSTEM_PROMPT, truncateContext } from '@/lib/ai/prompt';

describe('SYSTEM_PROMPT', () => {
  it('mentions tool usage and CNY default', () => {
    expect(SYSTEM_PROMPT).toMatch(/工具|tool/i);
    expect(SYSTEM_PROMPT).toMatch(/CNY|¥/);
  });
});

describe('truncateContext', () => {
  const mk = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
      role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
      content: `m${i}`,
    }));

  it('keeps all messages when under limit', () => {
    const msgs = mk(5);
    expect(truncateContext(msgs, 10)).toEqual(msgs);
  });

  it('keeps last N when over limit', () => {
    const msgs = mk(12);
    const kept = truncateContext(msgs, 10);
    expect(kept).toHaveLength(10);
    expect(kept[0].content).toBe('m2');
    expect(kept[9].content).toBe('m11');
  });

  it('default window is 10', () => {
    const msgs = mk(15);
    expect(truncateContext(msgs)).toHaveLength(10);
  });
});
