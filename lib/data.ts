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
      if (!firePlan.withdrawalRate.isZero())
      targetDecimal = firePlan.annualExpense.div(firePlan.withdrawalRate);
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

export async function fetchRecentCashFlows(userId: string, take = 5) {
  const flows = await prisma.cashFlowRecord.findMany({
    where: { userId },
    orderBy: { recordDate: 'desc' },
    take,
  });
  return flows;
}
