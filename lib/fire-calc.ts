export type FireParams = {
  initialAssets: number;
  annualSavings: number;
  annualExpense: number;   // retirement annual expense for FIRE target
  expectedReturn: number;  // e.g. 0.07 for 7%
  inflationRate: number;   // e.g. 0.03 for 3%
  withdrawalRate: number;  // e.g. 0.04 for 4%
  currentAge: number;
  retirementAge: number;
};

export type FireDataPoint = {
  age: number;
  assets: number;
};

const END_AGE = 90;

export function calculateFireCurve(params: FireParams): FireDataPoint[] {
  const {
    initialAssets,
    annualSavings,
    expectedReturn,
    inflationRate,
    withdrawalRate,
    currentAge,
    retirementAge,
  } = params;

  const result: FireDataPoint[] = [];
  let assets = initialAssets;

  for (let age = currentAge; age <= END_AGE; age++) {
    result.push({ age, assets: Math.round(assets) });

    if (age < retirementAge) {
      // Accumulation phase: grow assets by returns, add inflation-adjusted savings
      const yearIndex = age - currentAge;
      const adjustedSavings = annualSavings * Math.pow(1 + inflationRate, yearIndex);
      assets = assets * (1 + expectedReturn) + adjustedSavings;
    } else {
      // Withdrawal phase: grow assets, subtract withdrawal amount
      const withdrawalAmount = assets * withdrawalRate;
      assets = assets * (1 + expectedReturn) - withdrawalAmount;
    }
  }

  return result;
}

export function calculateFireTarget(annualExpense: number, withdrawalRate: number): number {
  if (withdrawalRate === 0) return 0;
  // Classic FIRE formula: target = annual retirement expense / withdrawal rate
  return Math.round(annualExpense / withdrawalRate);
}
