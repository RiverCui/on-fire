'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTranslations } from 'next-intl';
import { formatCurrency } from '@/lib/utils';

type MonthData = {
  month: string;
  income: number;
  expense: number;
};

type CashFlowBarChartProps = {
  data: MonthData[];
};

export default function CashFlowBarChart({ data }: CashFlowBarChartProps) {
  const t = useTranslations('DashboardPage');

  if (data.every((d) => d.income === 0 && d.expense === 0)) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-slate-400 dark:text-white/40">
        {t('trend.noData')}
      </div>
    );
  }

  // Format month label: "2026-04" → "4月" / "Apr"
  const formatMonth = (m: string) => {
    const [year, month] = m.split('-').map(Number);
    return new Date(year, month - 1).toLocaleDateString('default', { month: 'short' });
  };

  return (
    <div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} barGap={4} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
          <XAxis
            dataKey="month"
            tickFormatter={formatMonth}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#94a3b8' }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
            width={50}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              formatCurrency(value),
              name === 'income' ? t('trend.income') : t('trend.expense'),
            ]}
            labelFormatter={(label: string) => formatMonth(label)}
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid rgba(148,163,184,0.2)',
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(8px)',
              fontSize: '13px',
            }}
          />
          <Bar dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} />
          <Bar dataKey="expense" fill="#f43f5e" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-3 flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-emerald-500" />
          <span className="text-slate-600 dark:text-white/70">{t('trend.income')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-rose-500" />
          <span className="text-slate-600 dark:text-white/70">{t('trend.expense')}</span>
        </div>
      </div>
    </div>
  );
}
