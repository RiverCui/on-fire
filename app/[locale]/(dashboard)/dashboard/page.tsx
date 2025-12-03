import { ArrowUpRight, PiggyBank, Wallet, Zap } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/auth';
import { fetchFirePlan, fetchFireProgress } from '@/lib/data';
import AnimatedProgress from '@/components/dashboard/animated-progress';

const glassCard =
  'rounded-3xl border border-white/10 bg-white/60 p-6 text-slate-900 shadow-lg backdrop-blur-xl';

const recentFlows = [
  { labelKey: 'recentFlows.salary.label', amount: '+￥25,000', dateKey: 'recentFlows.salary.date', positive: true },
  { labelKey: 'recentFlows.investment.label', amount: '-￥5,000', dateKey: 'recentFlows.investment.date', positive: false },
  { labelKey: 'recentFlows.sideHustle.label', amount: '+￥3,800', dateKey: 'recentFlows.sideHustle.date', positive: true },
];

export default async function Page() {
  const t = await getTranslations('DashboardPage');
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return <div>{t('pleaseLogin')}</div>;
  }
  const { progressValue } = await fetchFireProgress(userId);

  const metrics = [
    {
      label: t('metrics.netWorth.label'),
      value: '¥ 1,280,000',
      change: t('metrics.netWorth.change'),
      icon: Wallet,
    },
    {
      label: t('metrics.savingsRate.label'),
      value: '52%',
      change: t('metrics.savingsRate.change'),
      icon: PiggyBank,
    },
    {
      label: t('metrics.cash.label'),
      value: '¥ 86,200',
      change: t('metrics.cash.change'),
      icon: Zap,
    },
  ];

  return (
    <div className="space-y-8">
      <section className="grid gap-6 md:grid-cols-3">
        {metrics.map((item) => (
          <div key={item.label} className={`${glassCard} flex flex-col`}>
            <div className="flex items-center justify-between text-slate-500">
              <p className="text-sm">{item.label}</p>
              <item.icon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-3xl font-semibold text-slate-900">{item.value}</p>
            <p className="mt-2 text-xs text-emerald-600">{item.change}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className={`${glassCard} space-y-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">{t('progressSection.title')}</p>
              <h3 className="text-2xl font-semibold">{t('progressSection.subtitle')}</h3>
            </div>
            <span className="rounded-full bg-slate-900/80 px-3 py-1 text-xs text-white">{t('progressSection.badge')}</span>
          </div>
          <AnimatedProgress targetValue={progressValue} />
          <div className="flex flex-wrap gap-6 text-sm text-slate-600">
            <div>
              <p className="text-xs uppercase tracking-wide">{t('progressSection.fields.accumulated')}</p>
              <p className="text-lg font-semibold text-slate-900">¥ 3,400,000</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide">{t('progressSection.fields.target')}</p>
              <p className="text-lg font-semibold text-slate-900">¥ 5,000,000</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide">{t('progressSection.fields.fireDate')}</p>
              <p className="text-lg font-semibold text-slate-900">2032 · Q1</p>
            </div>
          </div>
        </div>
        <div className={`${glassCard} space-y-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">{t('cashflow.title')}</p>
              <h3 className="text-xl font-semibold">{t('cashflow.subtitle')}</h3>
            </div>
            <button className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900">
              {t('cashflow.button')} <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
          <ul className="space-y-4">
            {recentFlows.map((flow) => (
              <li key={flow.labelKey} className="flex items-center justify-between rounded-2xl border border-slate-200/60 bg-white/70 px-4 py-3">
                <div>
                  <p className="font-medium text-slate-900">{t(flow.labelKey)}</p>
                  <p className="text-xs text-slate-500">{t(flow.dateKey)}</p>
                </div>
                <p className={`text-sm font-semibold ${flow.positive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {flow.amount}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={`${glassCard} grid gap-6 md:grid-cols-2`}>
        <div>
          <p className="text-sm text-slate-500">{t('allocation.title')}</p>
          <h3 className="text-xl font-semibold text-slate-900">{t('allocation.subtitle')}</h3>
          <p className="mt-3 text-sm text-slate-600">
            {t('allocation.description')}
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>{t('allocation.items.stocks')}</li>
            <li>{t('allocation.items.cash')}</li>
            <li>{t('allocation.items.bonds')}</li>
            <li>{t('allocation.items.other')}</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-white/40 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-2xl">
          <p className="text-xs uppercase tracking-[0.4em] text-white/70">{t('nextStep.label')}</p>
          <h3 className="mt-3 text-2xl font-semibold">{t('nextStep.title')}</h3>
          <p className="mt-3 text-sm text-white/70">
            {t('nextStep.description')}
          </p>
          <button className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-medium text-slate-900">
            {t('nextStep.button')}
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
