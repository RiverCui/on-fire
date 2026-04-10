export type FireParams = {
  initialAssets: number;
  annualIncome: number;    // current annual income
  annualExpense: number;   // current annual expense (also used for FIRE target)
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

export type FireResult = {
  data: FireDataPoint[];
  fireAge: number | null;       // age when assets first reach FIRE target
  depletedAge: number | null;   // age when assets first drop to zero or below
  assetsAtRetirement: number;   // portfolio value at retirement age
  totalWithdrawal: number;      // total amount withdrawn during retirement
};

const END_AGE = 90;

export function calculateFireCurve(params: FireParams): FireResult {
  const {
    initialAssets,
    annualIncome,
    annualExpense,
    expectedReturn,
    inflationRate,
    withdrawalRate,
    currentAge,
    retirementAge,
  } = params;

  const fireTarget = calculateFireTarget(annualExpense, withdrawalRate);
  const data: FireDataPoint[] = [];
  let assets = initialAssets;
  let firstYearWithdrawalAmount: number | null = null;
  let fireAge: number | null = null;
  let depletedAge: number | null = null;
  let assetsAtRetirement = 0;
  let totalWithdrawal = 0;

  for (let age = currentAge; age <= END_AGE; age++) {
    // Record the first year withdrawal at the moment of retirement
    if (age === retirementAge) {
      assetsAtRetirement = Math.round(assets);
      firstYearWithdrawalAmount = assets * withdrawalRate;
    }

    // Detect FIRE achievement: assets reach target before or at retirement
    if (fireAge === null && age <= retirementAge && assets >= fireTarget) {
      fireAge = age;
    }

    // Detect depletion: assets drop to zero or below during withdrawal phase
    if (depletedAge === null && age > retirementAge && assets <= 0) {
      depletedAge = age;
    }

    data.push({ age, assets: Math.round(Math.max(assets, 0)) });

    if (age < retirementAge) {
      // Accumulation phase: savings = income - expense, both adjusted for inflation
      const yearIndex = age - currentAge;
      const inflationFactor = Math.pow(1 + inflationRate, yearIndex);
      const adjustedSavings = (annualIncome - annualExpense) * inflationFactor;
      assets = assets * (1 + expectedReturn) + adjustedSavings;
    } else {
      // Withdrawal phase (classic 4% rule):
      // First year withdrawal = portfolio at retirement × withdrawalRate
      // Subsequent years: adjust previous withdrawal for inflation
      const yearsInRetirement = age - retirementAge;
      const withdrawalAmount = firstYearWithdrawalAmount! * Math.pow(1 + inflationRate, yearsInRetirement);
      const actualWithdrawal = assets > 0 ? Math.min(withdrawalAmount, assets * (1 + expectedReturn)) : 0;
      totalWithdrawal += actualWithdrawal;
      assets = assets * (1 + expectedReturn) - withdrawalAmount;
    }
  }

  return { data, fireAge, depletedAge, assetsAtRetirement, totalWithdrawal: Math.round(totalWithdrawal) };
}

export function calculateFireTarget(annualExpense: number, withdrawalRate: number): number {
  if (withdrawalRate === 0) return 0;
  // Classic FIRE formula: target = annual retirement expense / withdrawal rate
  return Math.round(annualExpense / withdrawalRate);
}
