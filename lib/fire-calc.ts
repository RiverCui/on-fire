export type FireParams = {
  initialAssets: number;
  annualIncome: number;     // current annual income
  annualExpense: number;    // current annual expense
  expectedReturn: number;   // e.g. 0.07 for 7%
  inflationRate: number;    // e.g. 0.03 for 3%
  lifeExpectancy: number;   // e.g. 90
  currentAge: number;
  retirementAge: number;
};

export type FireDataPoint = {
  age: number;
  assets: number;
};

export type FireResult = {
  data: FireDataPoint[];
  fireAge: number | null;       // age when assets first reach FIRE target
  depletedAge: number | null;   // age when assets first drop to zero or below
  assetsAtRetirement: number;   // portfolio value at retirement age
  totalWithdrawal: number;      // total amount withdrawn during retirement
};

export function calculateFireTarget(
  annualExpense: number,
  expectedReturn: number,
  inflationRate: number,
  currentAge: number,
  retirementAge: number,
  lifeExpectancy: number,
): number {
  const yearsToRetirement = Math.max(retirementAge - currentAge, 0);
  const retirementYears = Math.max(lifeExpectancy - retirementAge, 0);
  if (retirementYears <= 0) return 0;

  const retirementExpense = annualExpense * Math.pow(1 + inflationRate, yearsToRetirement);

  if (Math.abs(expectedReturn - inflationRate) < 1e-9) {
    // When return ≈ inflation, use limit form: E × N / (1 + r)
    return Math.round(retirementExpense * retirementYears / (1 + expectedReturn));
  }

  // PV of growing annuity: E × (1 - ((1+g)/(1+r))^N) / (r - g)
  const ratio = (1 + inflationRate) / (1 + expectedReturn);
  return Math.round(
    retirementExpense * (1 - Math.pow(ratio, retirementYears)) / (expectedReturn - inflationRate)
  );
}

export function calculateFireCurve(params: FireParams): FireResult {
  const {
    initialAssets,
    annualIncome,
    annualExpense,
    expectedReturn,
    inflationRate,
    lifeExpectancy,
    currentAge,
    retirementAge,
  } = params;

  const fireTarget = calculateFireTarget(
    annualExpense, expectedReturn, inflationRate, currentAge, retirementAge, lifeExpectancy,
  );
  const yearsToRetirement = Math.max(retirementAge - currentAge, 0);
  const retirementExpense = annualExpense * Math.pow(1 + inflationRate, yearsToRetirement);

  const data: FireDataPoint[] = [];
  let assets = initialAssets;
  let fireAge: number | null = null;
  let depletedAge: number | null = null;
  let assetsAtRetirement = 0;
  let totalWithdrawal = 0;

  for (let age = currentAge; age <= lifeExpectancy; age++) {
    if (age === retirementAge) {
      assetsAtRetirement = Math.round(assets);
    }

    if (fireAge === null && age <= retirementAge && assets >= fireTarget) {
      fireAge = age;
    }

    if (depletedAge === null && age > retirementAge && assets <= 0) {
      depletedAge = age;
    }

    data.push({ age, assets: Math.round(Math.max(assets, 0)) });

    if (age < retirementAge) {
      // Accumulation phase: unchanged
      const yearIndex = age - currentAge;
      const inflationFactor = Math.pow(1 + inflationRate, yearIndex);
      const adjustedSavings = (annualIncome - annualExpense) * inflationFactor;
      assets = assets * (1 + expectedReturn) + adjustedSavings;
    } else {
      // Withdrawal phase: expense-driven (fixed trajectory)
      const yearsInRetirement = age - retirementAge;
      const yearExpense = retirementExpense * Math.pow(1 + inflationRate, yearsInRetirement);
      const actualExpense = assets > 0 ? Math.min(yearExpense, assets * (1 + expectedReturn)) : 0;
      totalWithdrawal += actualExpense;
      assets = assets * (1 + expectedReturn) - yearExpense;
    }
  }

  return { data, fireAge, depletedAge, assetsAtRetirement, totalWithdrawal: Math.round(totalWithdrawal) };
}
