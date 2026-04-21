import prisma from '@/lib/prisma'
import { Prisma } from '@/generated/prisma/client';
import { FlowType } from '@/generated/prisma/client';

// Fetch FIRE progress data for a specific user
// calculate with Decimal for precision, then convert to number for frontend use
// Decimal.js: https://mikemcl.github.io/decimal.js/
export async function fetchFirePlan(userId: string) {
  const [assetAggregation, firePlan] = await Promise.all([
    // aggregate assets to calculate total value
    prisma.assetAccount.aggregate({
      where: { userId },
      _sum: { currentBalance: true },
    }),
    // fetch latest FIRE plan
    prisma.firePlan.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  ])

  // current total asset amount
  const currentDecimal = assetAggregation._sum.currentBalance || new Prisma.Decimal(0);

  // calculate target amount from fire plan
  let targetDecimal = new Prisma.Decimal(0);
  let planName = null;
  if (firePlan) {
    planName = firePlan.name;

    if (firePlan.customTarget && firePlan.customTarget.gt(0)) {
      targetDecimal = firePlan.customTarget;
    } else {
      // PV annuity target calculation
      const expense = firePlan.annualExpense.toNumber();
      const r = firePlan.expectedReturn.toNumber();
      const g = firePlan.inflationRate.toNumber();
      const yearsToRetirement = Math.max(firePlan.retirementAge - firePlan.currentAge, 0);
      const retirementYears = Math.max(firePlan.lifeExpectancy - firePlan.retirementAge, 0);

      if (retirementYears > 0) {
        const retirementExpense = expense * Math.pow(1 + g, yearsToRetirement);
        let target: number;
        if (Math.abs(r - g) < 1e-9) {
          target = retirementExpense * retirementYears / (1 + r);
        } else {
          const ratio = (1 + g) / (1 + r);
          target = retirementExpense * (1 - Math.pow(ratio, retirementYears)) / (r - g);
        }
        targetDecimal = new Prisma.Decimal(Math.round(target));
      }
    }
  }

  // calculate progress percentage
  let percentageDecimal = new Prisma.Decimal(0);
  if (targetDecimal.gt(0)) {
    percentageDecimal = currentDecimal.div(targetDecimal).mul(100);
  }

  const percentageNumber = percentageDecimal.toDecimalPlaces(1).toNumber();
  
  return {
    current: currentDecimal.toNumber(),
    target: targetDecimal.toNumber(),
    percentage: percentageNumber,
    progressValue: Math.max(0, percentageNumber), // ensure non-negative for progress bar
    planName,
    plan: firePlan,
  }
}

// Dashboard overview metrics (assets + recent cash flows)
export async function fetchDashboardMetrics(userId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [assetAggregation, cashAggregation, incomeAgg, expenseAgg] = await Promise.all([
    prisma.assetAccount.aggregate({
      where: { userId },
      _sum: { currentBalance: true },
    }),
    prisma.assetAccount.aggregate({
      where: { userId, type: 'CASH' },
      _sum: { currentBalance: true },
    }),
    prisma.cashFlowRecord.aggregate({
      where: { userId, type: FlowType.INCOME, recordDate: { gte: thirtyDaysAgo } },
      _sum: { amount: true },
    }),
    prisma.cashFlowRecord.aggregate({
      where: { userId, type: FlowType.EXPENSE, recordDate: { gte: thirtyDaysAgo } },
      _sum: { amount: true },
    }),
  ]);

  const totalAssets = assetAggregation._sum.currentBalance || new Prisma.Decimal(0);
  const cashBalance = cashAggregation._sum.currentBalance || new Prisma.Decimal(0);
  const income = incomeAgg._sum.amount || new Prisma.Decimal(0);
  const expense = expenseAgg._sum.amount || new Prisma.Decimal(0);

  let savingsRate = 0;
  if (!income.isZero()) {
    savingsRate = income.minus(expense).div(income).mul(100).toDecimalPlaces(1).toNumber();
  }

  return {
    totalAssets: totalAssets.toNumber(),
    cashBalance: cashBalance.toNumber(),
    income: income.toNumber(),
    expense: expense.toNumber(),
    savingsRate: Math.max(-999, Math.min(999, savingsRate)), // clamp for display
  };
}

// Fetch all asset accounts for a user
export async function fetchAssetAccounts(userId: string) {
  const accounts = await prisma.assetAccount.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });
  return accounts;
}

export async function fetchRecentCashFlows(userId: string, take = 5) {
  const flows = await prisma.cashFlowRecord.findMany({
    where: { userId },
    orderBy: { recordDate: 'desc' },
    take,
  });
  return flows;
}

// Fetch cash flow records with optional month filter (e.g. "2026-04")
export async function fetchCashFlows(userId: string, month?: string) {
  const where: { userId: string; recordDate?: { gte: Date; lt: Date } } = { userId };

  if (month) {
    const [year, m] = month.split('-').map(Number);
    const start = new Date(year, m - 1, 1);
    const end = new Date(year, m, 1);
    where.recordDate = { gte: start, lt: end };
  }

  return prisma.cashFlowRecord.findMany({
    where,
    orderBy: { recordDate: 'desc' },
  });
}

// Monthly summary: total income, total expense, net flow
export async function fetchCashFlowSummary(userId: string, month: string) {
  const [year, m] = month.split('-').map(Number);
  const start = new Date(year, m - 1, 1);
  const end = new Date(year, m, 1);

  const [incomeAgg, expenseAgg] = await Promise.all([
    prisma.cashFlowRecord.aggregate({
      where: { userId, type: FlowType.INCOME, recordDate: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
    prisma.cashFlowRecord.aggregate({
      where: { userId, type: FlowType.EXPENSE, recordDate: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
  ]);

  const income = incomeAgg._sum.amount ? Number(incomeAgg._sum.amount) : 0;
  const expense = expenseAgg._sum.amount ? Number(expenseAgg._sum.amount) : 0;

  return { income, expense, net: income - expense };
}

// Monthly cash flow trend for the last N months (for bar chart)
export async function fetchMonthlyCashFlowTrend(userId: string, months = 6) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

  const records = await prisma.cashFlowRecord.findMany({
    where: { userId, recordDate: { gte: start } },
    select: { recordDate: true, type: true, amount: true },
  });

  // Build month buckets
  const result: { month: string; income: number; expense: number }[] = [];
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - months + 1 + i, 1);
    result.push({
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      income: 0,
      expense: 0,
    });
  }

  for (const r of records) {
    const key = `${r.recordDate.getFullYear()}-${String(r.recordDate.getMonth() + 1).padStart(2, '0')}`;
    const bucket = result.find((b) => b.month === key);
    if (bucket) {
      const amt = Number(r.amount);
      if (r.type === FlowType.INCOME) bucket.income += amt;
      else bucket.expense += amt;
    }
  }

  return result;
}

// Net worth trend: total assets over time, reconstructed from AssetRecord snapshots.
// For each day with any snapshot, emit (date, sum of latest balance per account ≤ that day).
export type TrendRange = '1M' | '3M' | '6M' | '1Y';

export async function fetchNetWorthTrend(userId: string, range: TrendRange = '6M') {
  const days = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365 }[range];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days);

  const accounts = await prisma.assetAccount.findMany({
    where: { userId },
    select: { id: true, currentBalance: true },
  });
  if (accounts.length === 0) return [];

  const accountIds = accounts.map((a) => a.id);

  // Fetch all snapshots (we need pre-range records to seed initial balances)
  const records = await prisma.assetRecord.findMany({
    where: { assetAccountId: { in: accountIds } },
    orderBy: { recordDate: 'asc' },
    select: { assetAccountId: true, recordDate: true, amount: true },
  });

  // Running balance per account, replayed day by day
  const balances = new Map<string, number>();
  for (const id of accountIds) balances.set(id, 0);

  const toDayKey = (d: Date) => d.toISOString().slice(0, 10);
  const startKey = toDayKey(start);

  // Group records by day
  const byDay = new Map<string, typeof records>();
  for (const r of records) {
    const key = toDayKey(r.recordDate);
    const bucket = byDay.get(key);
    if (bucket) bucket.push(r);
    else byDay.set(key, [r]);
  }

  const sortedDays = [...byDay.keys()].sort();
  const result: { date: string; total: number }[] = [];

  for (const day of sortedDays) {
    for (const r of byDay.get(day)!) {
      balances.set(r.assetAccountId, Number(r.amount));
    }
    if (day >= startKey) {
      const total = [...balances.values()].reduce((a, b) => a + b, 0);
      result.push({ date: day, total });
    }
  }

  // Always anchor today with currentBalance sum, so the line reaches the present
  const todayKey = toDayKey(new Date());
  const todayTotal = accounts.reduce((s, a) => s + Number(a.currentBalance), 0);
  if (result.length === 0 || result[result.length - 1].date !== todayKey) {
    result.push({ date: todayKey, total: todayTotal });
  } else {
    result[result.length - 1].total = todayTotal;
  }

  return result;
}

// Asset distribution grouped by AssetType (for pie chart)
export async function fetchAssetDistribution(userId: string) {
  const accounts = await prisma.assetAccount.groupBy({
    by: ['type'],
    where: { userId },
    _sum: { currentBalance: true },
  });

  return accounts
    .map((g) => ({
      type: g.type,
      value: g._sum.currentBalance ? Number(g._sum.currentBalance) : 0,
    }))
    .filter((g) => g.value > 0)
    .sort((a, b) => b.value - a.value);
}
