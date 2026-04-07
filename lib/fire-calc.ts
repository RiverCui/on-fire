export type FireParams = {
  initialAssets: number;
  annualSavings: number;
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

export function calculateFireTarget(annualSavings: number, withdrawalRate: number): number {
  if (withdrawalRate === 0) return 0;
  // FIRE target: annual expense in retirement ≈ annual savings (lifestyle maintained)
  return Math.round(annualSavings / withdrawalRate);
}
