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
