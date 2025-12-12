import { ArrowUpRight, PiggyBank, Wallet, Zap } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/auth';
import { fetchDashboardMetrics, fetchFirePlan, fetchRecentCashFlows } from '@/lib/data';
import AnimatedProgress from '@/components/dashboard/animated-progress';
import { formatCurrency, formatDateToLocal } from '@/lib/utils';
import FirePlanTour from '@/components/dashboard/fire-plan-tour';

const glassCard =
  'rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-lg backdrop-blur-xl';

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
  ]);

  console.log('progress', progress);

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
      <section className="grid gap-6 md:grid-cols-3">
        {cards.map((item) => (
          <div key={item.label} className={`${glassCard} flex flex-col`}>
            <div className="flex items-center justify-between text-white/60">
              <p className="text-sm">{item.label}</p>
              <item.icon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-3xl font-semibold text-white">{item.value}</p>
            <p className="mt-2 text-xs text-emerald-400">{item.change}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className={`${glassCard} space-y-6`} data-tour="progress-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">{t('progressSection.title')}</p>
              <h3 className="text-2xl font-semibold text-white">{progress.planName || t('progressSection.subtitle')}</h3>
            </div>
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs text-slate-900">{t('progressSection.badge')}</span>
          </div>
          <AnimatedProgress targetValue={progress.progressValue} />
          <div className="flex flex-wrap gap-6 text-sm text-white/70">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/50">{t('progressSection.fields.accumulated')}</p>
              <p className="text-lg font-semibold text-white">{formatCurrency(progress.current)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-white/50">{t('progressSection.fields.target')}</p>
              <p className="text-lg font-semibold text-white">{progress.target > 0 ? formatCurrency(progress.target) : t('progressSection.noTarget')}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-white/50">{t('progressSection.fields.fireDate')}</p>
              <p className="text-lg font-semibold text-white">{t('progressSection.dynamicProgress', { value: `${progress.percentage}%` })}</p>
            </div>
          </div>
          {plan && (
            <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80 md:grid-cols-4">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-white/50">{t('progressSection.plan.annualExpense')}</p>
                <p className="text-sm font-semibold text-white">{formatCurrency(Number(plan.annualExpense))}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-white/50">{t('progressSection.plan.withdrawalRate')}</p>
                <p className="text-sm font-semibold text-white">{(Number(plan.withdrawalRate) * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-white/50">{t('progressSection.plan.currentAge')}</p>
                <p className="text-sm font-semibold text-white">{plan.currentAge}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-white/50">{t('progressSection.plan.retirementAge')}</p>
                <p className="text-sm font-semibold text-white">{plan.retirementAge}</p>
              </div>
            </div>
          )}
        </div>
        <div className={`${glassCard} space-y-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">{t('cashflow.title')}</p>
              <h3 className="text-xl font-semibold text-white">{t('cashflow.subtitle')}</h3>
            </div>
            <button className="inline-flex items-center gap-1 text-xs font-medium text-white/60 hover:text-white">
              {t('cashflow.button')} <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
          <ul className="space-y-4">
            {recentFlows.map((flow) => (
              <li key={flow.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                <div>
                  <p className="font-medium text-white">{flow.category || flow.note || t('cashflow.untitled')}</p>
                  <p className="text-xs text-white/50">{formatDateToLocal(flow.recordDate.toString())}</p>
                </div>
                <p className={`text-sm font-semibold ${flow.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {`${flow.type === 'INCOME' ? '+' : '-'}${formatCurrency(Number(flow.amount))}`}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={`${glassCard} grid gap-6 md:grid-cols-2`}>
        <div>
          <p className="text-sm text-white/60">{t('allocation.title')}</p>
          <h3 className="text-xl font-semibold text-white">{t('allocation.subtitle')}</h3>
          <p className="mt-3 text-sm text-white/70">
            {t('allocation.description')}
          </p>
          <ul className="mt-4 space-y-2 text-sm text-white/70">
            <li>{t('allocation.items.stocks')}</li>
            <li>{t('allocation.items.cash')}</li>
            <li>{t('allocation.items.bonds')}</li>
            <li>{t('allocation.items.other')}</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-white/20 to-white/5 p-6 shadow-2xl backdrop-blur">
          <p className="text-xs uppercase tracking-[0.4em] text-white/70">{t('nextStep.label')}</p>
          <h3 className="mt-3 text-2xl font-semibold text-white">{t('nextStep.title')}</h3>
          <p className="mt-3 text-sm text-white/70">
            {t('nextStep.description')}
          </p>
          <button className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/90 px-5 py-2 text-sm font-medium text-slate-900 hover:bg-white">
            {t('nextStep.button')}
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
