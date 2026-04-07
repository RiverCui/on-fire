import { ArrowUpRight, PiggyBank, Wallet, Zap } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/auth';
import { /* fetchAssetDistribution, */ fetchDashboardMetrics, fetchFirePlan, /* fetchMonthlyCashFlowTrend, */ fetchRecentCashFlows } from '@/lib/data';
import AnimatedProgress from '@/components/dashboard/animated-progress';
// import AssetPieChart from '@/components/dashboard/charts/asset-pie-chart';
// import CashFlowBarChart from '@/components/dashboard/charts/cashflow-bar-chart';
import FireSimulator from '@/components/dashboard/fire-simulator';
import { formatCurrency, formatDateToLocal } from '@/lib/utils';
import FirePlanTour from '@/components/dashboard/fire-plan-tour';

const glassCard =
  'rounded-3xl border border-slate-200 bg-white/80 p-6 text-slate-900 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:text-white';

export default async function Page() {
  const t = await getTranslations('DashboardPage');
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return <div>{t('pleaseLogin')}</div>;
  }
  const [progress, metrics, recentFlows] = await Promise.all([
    fetchFirePlan(userId),
    fetchDashboardMetrics(userId),
    fetchRecentCashFlows(userId, 5),
    // fetchAssetDistribution(userId),
    // fetchMonthlyCashFlowTrend(userId, 6),
  ]);

  const plan = progress.plan;

  const cards = [
    {
      label: t('metrics.netWorth.label'),
      value: formatCurrency(metrics.totalAssets),
      change: metrics.totalAssets > 0 ? t('metrics.netWorth.change') : t('metrics.noData'),
      icon: Wallet,
    },
    {
      label: t('metrics.savingsRate.label'),
      value: `${metrics.savingsRate}%`,
      change: metrics.income > 0 ? t('metrics.savingsRate.change') : t('metrics.noData'),
      icon: PiggyBank,
    },
    {
      label: t('metrics.cash.label'),
      value: formatCurrency(metrics.cashBalance),
      change: metrics.cashBalance > 0 ? t('metrics.cash.change') : t('metrics.noData'),
      icon: Zap,
    },
  ];

  return (
    <div className="space-y-8">
      {/* <FirePlanTour show={!plan} /> */}

      {/* FIRE Simulator */}
      <section className={glassCard}>
        <div className="mb-4">
          <p className="text-sm text-slate-500 dark:text-white/60">{t('simulator.title')}</p>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{t('simulator.subtitle')}</h3>
        </div>
        <FireSimulator
          currentAssets={metrics.totalAssets}
          firePlan={plan ? {
            annualSavings: Number(plan.annualExpense),
            expectedReturn: Number(plan.expectedReturn),
            inflationRate: Number(plan.inflationRate),
            withdrawalRate: Number(plan.withdrawalRate),
            currentAge: plan.currentAge,
            retirementAge: plan.retirementAge,
          } : null}
        />
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {cards.map((item) => (
          <div key={item.label} className={`${glassCard} flex flex-col`}>
            <div className="flex items-center justify-between text-slate-500 dark:text-white/60">
              <p className="text-sm">{item.label}</p>
              <item.icon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">{item.value}</p>
            <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">{item.change}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className={`${glassCard} space-y-6`} data-tour="progress-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-white/60">{t('progressSection.title')}</p>
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">{progress.planName || t('progressSection.subtitle')}</h3>
            </div>
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs text-white shadow-sm dark:bg-white/90 dark:text-slate-900">{t('progressSection.badge')}</span>
          </div>
          <AnimatedProgress targetValue={progress.progressValue} />
          <div className="flex flex-wrap gap-6 text-sm text-slate-600 dark:text-white/70">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-white/50">{t('progressSection.fields.accumulated')}</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{formatCurrency(progress.current)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-white/50">{t('progressSection.fields.target')}</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{progress.target > 0 ? formatCurrency(progress.target) : t('progressSection.noTarget')}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-white/50">{t('progressSection.fields.fireDate')}</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{t('progressSection.dynamicProgress', { value: `${progress.percentage}%` })}</p>
            </div>
          </div>
          {plan && (
            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-700 md:grid-cols-4 dark:border-white/10 dark:bg-white/5 dark:text-white/80">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-white/50">{t('progressSection.plan.annualExpense')}</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(Number(plan.annualExpense))}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-white/50">{t('progressSection.plan.withdrawalRate')}</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{(Number(plan.withdrawalRate) * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-white/50">{t('progressSection.plan.currentAge')}</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{plan.currentAge}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-white/50">{t('progressSection.plan.retirementAge')}</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{plan.retirementAge}</p>
              </div>
            </div>
          )}
        </div>
        <div className={`${glassCard} space-y-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-white/60">{t('cashflow.title')}</p>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{t('cashflow.subtitle')}</h3>
            </div>
            <button className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-white/60 dark:hover:text-white">
              {t('cashflow.button')} <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
          <ul className="space-y-4">
            {recentFlows.map((flow) => (
              <li key={flow.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-white/5">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{flow.category || flow.note || t('cashflow.untitled')}</p>
                  <p className="text-xs text-slate-500 dark:text-white/50">{formatDateToLocal(flow.recordDate.toString())}</p>
                </div>
                <p className={`text-sm font-semibold ${flow.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                  {`${flow.type === 'INCOME' ? '+' : '-'}${formatCurrency(Number(flow.amount))}`}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* C Section: Charts (temporarily hidden)
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className={`${glassCard}`}>
          <div className="mb-4">
            <p className="text-sm text-slate-500 dark:text-white/60">{t('trend.title')}</p>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{t('trend.subtitle')}</h3>
          </div>
          <CashFlowBarChart data={cashFlowTrend} />
        </div>
        <div className={`${glassCard}`}>
          <div className="mb-4">
            <p className="text-sm text-slate-500 dark:text-white/60">{t('allocation.title')}</p>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{t('allocation.subtitle')}</h3>
          </div>
          <AssetPieChart data={assetDist} />
        </div>
      </section>
      */}
    </div>
  );
}
