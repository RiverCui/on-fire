export type FireParams = {
  initialAssets: number;
  annualExpense: number;
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
    annualExpense,
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
      // Accumulation phase: grow assets, subtract inflation-adjusted expenses
      const yearIndex = age - currentAge;
      const adjustedExpense = annualExpense * Math.pow(1 + inflationRate, yearIndex);
      assets = assets * (1 + expectedReturn) - adjustedExpense;
    } else {
      // Withdrawal phase: grow assets, subtract withdrawal amount
      assets = assets * (1 + expectedReturn) - assets * withdrawalRate;
    }

    if (assets < 0) {
      assets = 0;
    }
  }

  return result;
}

export function calculateFireTarget(annualExpense: number, withdrawalRate: number): number {
  if (withdrawalRate === 0) return 0;
  return Math.round(annualExpense / withdrawalRate);
}
