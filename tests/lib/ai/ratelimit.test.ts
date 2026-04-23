import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/redis', () => ({ redis: {} }));

const limitMinMock = vi.fn();
const limitDayMock = vi.fn();

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class {
    limit: (id: string) => Promise<{ success: boolean; reset: number }>;
    static slidingWindow() { return {}; }
    constructor(opts: { prefix: string }) {
      this.limit = opts.prefix.includes('min') ? limitMinMock : limitDayMock;
    }
  },
}));

beforeEach(() => {
  limitMinMock.mockReset();
  limitDayMock.mockReset();
});

describe('checkChatLimit', () => {
  it('returns ok when both pass', async () => {
    limitMinMock.mockResolvedValue({ success: true, reset: 0 });
    limitDayMock.mockResolvedValue({ success: true, reset: 0 });
    const { checkChatLimit } = await import('@/lib/ai/ratelimit');
    expect(await checkChatLimit('u1')).toEqual({ ok: true });
  });

  it('short-circuits on min failure without calling day', async () => {
    limitMinMock.mockResolvedValue({ success: false, reset: 42 });
    const { checkChatLimit } = await import('@/lib/ai/ratelimit');
    const res = await checkChatLimit('u1');
    expect(res).toEqual({ ok: false, which: 'min', reset: 42 });
    expect(limitDayMock).not.toHaveBeenCalled();
  });

  it('returns day failure when min passes but day fails', async () => {
    limitMinMock.mockResolvedValue({ success: true, reset: 0 });
    limitDayMock.mockResolvedValue({ success: false, reset: 99 });
    const { checkChatLimit } = await import('@/lib/ai/ratelimit');
    expect(await checkChatLimit('u1')).toEqual({ ok: false, which: 'day', reset: 99 });
  });
});
