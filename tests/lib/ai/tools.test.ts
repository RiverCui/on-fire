import { describe, it, expect, vi } from 'vitest';
import type { z } from 'zod';

vi.mock('@/actions/ai-query', () => ({
  queryNetWorth: vi.fn(async () => ({ total: 100, currency: 'CNY' })),
  queryAssetBreakdown: vi.fn(async () => ({ accounts: [], byType: {} })),
  queryCashFlowSummary: vi.fn(async () => ({ income: 0, expense: 0, net: 0, currency: 'CNY' })),
  queryCashFlowByCategory: vi.fn(async () => []),
  queryFirePlanProgress: vi.fn(async () => ({ hasPlan: false })),
  queryAssetTrend: vi.fn(async () => []),
  queryRecentTransactions: vi.fn(async () => []),
}));

import { buildTools } from '@/lib/ai/tools';

describe('buildTools', () => {
  it('returns the 7 expected tools', () => {
    const tools = buildTools('user-1');
    expect(Object.keys(tools).sort()).toEqual([
      'getAssetBreakdown',
      'getAssetTrend',
      'getCashFlowByCategory',
      'getCashFlowSummary',
      'getFirePlanProgress',
      'getNetWorth',
      'getRecentTransactions',
    ]);
  });

  it('rejects invalid date on getCashFlowSummary', async () => {
    const tools = buildTools('user-1');
    const schema = tools.getCashFlowSummary.inputSchema as z.ZodType<{
      startDate: string;
      endDate: string;
      type?: 'INCOME' | 'EXPENSE';
    }>;
    const parsed = schema.safeParse({ startDate: 'bad', endDate: '2026-01-01' });
    expect(parsed.success).toBe(false);
  });

  it('injects userId into execute via closure', async () => {
    const mod = await import('@/actions/ai-query');
    const tools = buildTools('user-42');
    await tools.getNetWorth.execute!({}, { toolCallId: 't1', messages: [] });
    expect(mod.queryNetWorth).toHaveBeenCalledWith('user-42');
  });
});
