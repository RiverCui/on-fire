import 'server-only';
import prisma from '@/lib/prisma';
import { FlowType, AssetType } from '@/generated/prisma/client';

export async function queryNetWorth(userId: string) {
  const accounts = await prisma.assetAccount.findMany({
    where: { userId },
    select: { currentBalance: true },
  });
  const total = accounts.reduce((sum, a) => sum + Number(a.currentBalance), 0);
  return { total, currency: 'CNY' };
}

export async function queryAssetBreakdown(userId: string) {
  const accounts = await prisma.assetAccount.findMany({
    where: { userId },
    select: { name: true, type: true, currentBalance: true },
  });
  const byType: Record<AssetType, number> = {
    CASH: 0, STOCK: 0, BOND: 0, REAL_ESTATE: 0, CRYPTO: 0, DEBT: 0, OTHER: 0,
  };
  for (const a of accounts) byType[a.type] += Number(a.currentBalance);
  return {
    accounts: accounts.map(a => ({ name: a.name, type: a.type, balance: Number(a.currentBalance) })),
    byType,
  };
}

export async function queryCashFlowSummary(
  userId: string,
  args: { startDate: string; endDate: string; type?: 'INCOME' | 'EXPENSE' },
) {
  const where = {
    userId,
    recordDate: { gte: new Date(args.startDate), lte: new Date(args.endDate) },
    ...(args.type ? { type: args.type as FlowType } : {}),
  };
  const rows = await prisma.cashFlowRecord.findMany({ where, select: { type: true, amount: true } });
  let income = 0, expense = 0;
  for (const r of rows) {
    if (r.type === 'INCOME') income += Number(r.amount);
    else if (r.type === 'EXPENSE') expense += Number(r.amount);
  }
  return { income, expense, net: income - expense, currency: 'CNY' };
}

export async function queryCashFlowByCategory(
  userId: string,
  args: { startDate: string; endDate: string },
) {
  const rows = await prisma.cashFlowRecord.groupBy({
    by: ['type', 'category'],
    where: {
      userId,
      recordDate: { gte: new Date(args.startDate), lte: new Date(args.endDate) },
    },
    _sum: { amount: true },
  });
  return rows.map(r => ({
    type: r.type,
    category: r.category ?? '未分类',
    amount: Number(r._sum.amount ?? 0),
  }));
}

export async function queryFirePlanProgress(userId: string) {
  const plan = await prisma.firePlan.findFirst({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });
  if (!plan) return { hasPlan: false };

  const { total: netWorth } = await queryNetWorth(userId);
  const annualExpense = Number(plan.annualExpense);
  const target = plan.customTarget ? Number(plan.customTarget) : annualExpense * 25; // 4% rule
  const progress = target > 0 ? netWorth / target : 0;
  const yearsToTarget = Math.max(0, plan.retirementAge - plan.currentAge);

  return {
    hasPlan: true,
    planName: plan.name,
    netWorth,
    target,
    progress,
    yearsToTarget,
    currency: 'CNY',
  };
}

export async function queryAssetTrend(
  userId: string,
  args: { accountId?: string; range: '1M' | '3M' | '6M' | '1Y' | 'ALL' },
) {
  const monthsMap = { '1M': 1, '3M': 3, '6M': 6, '1Y': 12, ALL: 120 } as const;
  const months = monthsMap[args.range];
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const where = {
    recordDate: { gte: since },
    assetAccount: { userId, ...(args.accountId ? { id: args.accountId } : {}) },
  };
  const records = await prisma.assetRecord.findMany({
    where,
    select: { recordDate: true, amount: true, assetAccountId: true },
    orderBy: { recordDate: 'asc' },
  });
  return records.map(r => ({
    date: r.recordDate.toISOString().slice(0, 10),
    amount: Number(r.amount),
    accountId: r.assetAccountId,
  }));
}

export async function queryRecentTransactions(userId: string, args: { limit: number }) {
  const rows = await prisma.cashFlowRecord.findMany({
    where: { userId },
    orderBy: { recordDate: 'desc' },
    take: Math.max(1, Math.min(args.limit, 50)),
    select: {
      recordDate: true, type: true, amount: true, category: true, note: true,
    },
  });
  return rows.map(r => ({
    date: r.recordDate.toISOString().slice(0, 10),
    type: r.type,
    amount: Number(r.amount),
    category: r.category ?? null,
    note: r.note ?? null,
  }));
}
