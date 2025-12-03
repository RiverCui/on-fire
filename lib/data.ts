import prisma from '@/lib/prisma'
import { Prisma } from '@/generated/prisma/client';

// Fetch FIRE plan data for a specific user
export async function fetchFirePlan(userId: string) {
  try {
    const plans = await prisma.firePlan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return plans;
  } catch (error) {
    console.log('Failed to fetch FIRE plans:', error);
    return null;
  }
}

// Fetch FIRE progress data for a specific user
// calculate with Decimal for precision, then convert to number for frontend use
// Decimal.js: https://mikemcl.github.io/decimal.js/
export async function fetchFireProgress(userId: string) {
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
  }
}
