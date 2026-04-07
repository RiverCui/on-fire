'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useTranslations } from 'next-intl';
import { formatCurrency } from '@/lib/utils';
import type { AssetType } from '@/generated/prisma/client';

type AssetDistItem = {
  type: AssetType;
  value: number;
};

type AssetPieChartProps = {
  data: AssetDistItem[];
};

const COLORS: Record<AssetType, string> = {
  CASH: '#10b981',
  STOCK: '#3b82f6',
  BOND: '#f59e0b',
  REAL_ESTATE: '#a855f7',
  CRYPTO: '#f97316',
  DEBT: '#f43f5e',
  OTHER: '#64748b',
};

export default function AssetPieChart({ data }: AssetPieChartProps) {
  const t = useTranslations('AccountPage');
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (data.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-slate-400 dark:text-white/40">
        No data
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
      {/* Chart */}
      <div className="h-[220px] w-[220px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="type"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={3}
              strokeWidth={0}
            >
              {data.map((entry) => (
                <Cell key={entry.type} fill={COLORS[entry.type]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(label: string) => t(`types.${label as AssetType}`)}
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid rgba(148,163,184,0.2)',
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(8px)',
                fontSize: '13px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {data.map((item) => {
          const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
          return (
            <div key={item.type} className="flex items-center gap-3 text-sm">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: COLORS[item.type] }}
              />
              <span className="w-16 text-slate-600 dark:text-white/70">
                {t(`types.${item.type}`)}
              </span>
              <span className="font-medium text-slate-900 dark:text-white">{pct}%</span>
              <span className="text-slate-400 dark:text-white/40">{formatCurrency(item.value)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
