import { tool } from 'ai';
import { z } from 'zod';
import {
  queryNetWorth,
  queryAssetBreakdown,
  queryCashFlowSummary,
  queryCashFlowByCategory,
  queryFirePlanProgress,
  queryAssetTrend,
  queryRecentTransactions,
} from '@/actions/ai-query';

export function buildTools(userId: string) {
  return {
    getNetWorth: tool({
      description: '查询用户当前的总净资产',
      inputSchema: z.object({}),
      execute: async () => queryNetWorth(userId),
    }),
    getAssetBreakdown: tool({
      description: '按资产类型（现金/股票/房产等）和账户返回当前分布',
      inputSchema: z.object({}),
      execute: async () => queryAssetBreakdown(userId),
    }),
    getCashFlowSummary: tool({
      description:
        '指定区间收支汇总。type 可选 INCOME / EXPENSE，不传则返回双向 + net',
      inputSchema: z.object({
        startDate: z.string().date(),
        endDate: z.string().date(),
        type: z.enum(['INCOME', 'EXPENSE']).optional(),
      }),
      execute: async (args) => queryCashFlowSummary(userId, args),
    }),
    getCashFlowByCategory: tool({
      description: '按分类聚合收支（餐饮/交通/工资等），区间内每个 type+category 的小计',
      inputSchema: z.object({
        startDate: z.string().date(),
        endDate: z.string().date(),
      }),
      execute: async (args) => queryCashFlowByCategory(userId, args),
    }),
    getFirePlanProgress: tool({
      description: 'FIRE 目标达成率、剩余年数、当前缺口',
      inputSchema: z.object({}),
      execute: async () => queryFirePlanProgress(userId),
    }),
    getAssetTrend: tool({
      description:
        '资产时间序列。不传 accountId 返回全部账户的记录；range 控制回看范围',
      inputSchema: z.object({
        accountId: z.string().optional(),
        range: z.enum(['1M', '3M', '6M', '1Y', 'ALL']).default('3M'),
      }),
      execute: async (args) => queryAssetTrend(userId, args),
    }),
    getRecentTransactions: tool({
      description: '最近 N 笔现金流流水，按日期倒序',
      inputSchema: z.object({
        limit: z.number().int().min(1).max(50).default(10),
      }),
      execute: async (args) => queryRecentTransactions(userId, args),
    }),
  };
}
