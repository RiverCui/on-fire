'use client';

import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTranslations } from 'next-intl';
import { formatCurrency } from '@/lib/utils';

type Point = { date: string; total: number };
type Range = '1M' | '3M' | '6M' | '1Y';
const RANGES: Range[] = ['1M', '3M', '6M', '1Y'];
const RANGE_DAYS: Record<Range, number> = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365 };

export default function NetWorthLineChart({ data }: { data: Point[] }) {
  const t = useTranslations('DashboardPage.netWorthTrend');
  const [range, setRange] = useState<Range>('6M');

  const filtered = useMemo(() => {
    if (data.length === 0) return [];
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - RANGE_DAYS[range]);
    const cutoffKey = cutoff.toISOString().slice(0, 10);
    return data.filter((d) => d.date >= cutoffKey);
  }, [data, range]);

  if (data.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-slate-400 dark:text-white/40">
        {t('noData')}
      </div>
    );
  }

  const formatDate = (s: string) => {
    const [, m, d] = s.split('-').map(Number);
    return `${m}/${d}`;
  };

  return (
    <div>
      <div className="mb-3 flex justify-end gap-1">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              range === r
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'text-slate-500 hover:bg-slate-100 dark:text-white/60 dark:hover:bg-white/10'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={filtered} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="netWorthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            minTickGap={32}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            tickFormatter={(v: number) =>
              Math.abs(v) >= 10000 ? `${(v / 10000).toFixed(1)}w` : String(v)
            }
            width={50}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), t('label')]}
            labelFormatter={(label: string) => label}
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid rgba(148,163,184,0.2)',
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(8px)',
              fontSize: '13px',
            }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#netWorthFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
