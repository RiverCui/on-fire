'use client';

import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { Slider } from '@/components/ui/slider';
import { useTranslations } from 'next-intl';
import { calculateFireCurve, calculateFireTarget } from '@/lib/fire-calc';
import type { FireParams } from '@/lib/fire-calc';

type FirePlanData = {
  annualExpense?: number;
  expectedReturn?: number;
  inflationRate?: number;
  withdrawalRate?: number;
  currentAge?: number;
  retirementAge?: number;
} | null;

type FireSimulatorProps = {
  currentAssets: number;
  firePlan: FirePlanData;
};

type SliderConfig = {
  key: keyof FireParams;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
};

export default function FireSimulator({ currentAssets, firePlan }: FireSimulatorProps) {
  const t = useTranslations('DashboardPage.simulator');

  const [params, setParams] = useState<FireParams>({
    initialAssets: currentAssets || 500000,
    annualExpense: firePlan?.annualExpense ?? 200000,
    expectedReturn: firePlan?.expectedReturn ?? 0.07,
    inflationRate: firePlan?.inflationRate ?? 0.03,
    withdrawalRate: firePlan?.withdrawalRate ?? 0.04,
    currentAge: firePlan?.currentAge ?? 25,
    retirementAge: firePlan?.retirementAge ?? 45,
  });

  const data = useMemo(() => calculateFireCurve(params), [params]);
  const fireTarget = useMemo(
    () => calculateFireTarget(params.annualExpense, params.withdrawalRate),
    [params.annualExpense, params.withdrawalRate],
  );

  const formatWan = (v: number) => `${(v / 10000).toFixed(0)}${t('unitWan')}`;
  const formatPercent = (v: number) => `${(v * 100).toFixed(1)}${t('unitPercent')}`;
  const formatAge = (v: number) => `${v}${t('unitAge')}`;

  const sliders: SliderConfig[] = [
    { key: 'initialAssets', min: 0, max: 10000000, step: 100000, format: formatWan },
    { key: 'annualExpense', min: 10000, max: 1000000, step: 10000, format: formatWan },
    { key: 'expectedReturn', min: 0, max: 0.15, step: 0.005, format: formatPercent },
    { key: 'inflationRate', min: 0, max: 0.10, step: 0.005, format: formatPercent },
    { key: 'withdrawalRate', min: 0.02, max: 0.06, step: 0.001, format: formatPercent },
    { key: 'currentAge', min: 18, max: 60, step: 1, format: formatAge },
    { key: 'retirementAge', min: 30, max: 70, step: 1, format: formatAge },
  ];

  const handleChange = (key: keyof FireParams, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Slider Panel */}
      <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-3">
        {sliders.map(({ key, min, max, step, format }) => (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-white/70">{t(key)}</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {format(params[key])}
              </span>
            </div>
            <Slider
              value={[params[key]]}
              min={min}
              max={max}
              step={step}
              onValueChange={([v]) => handleChange(key, v)}
            />
          </div>
        ))}
      </div>

      {/* Line Chart */}
      <ResponsiveContainer width="100%" height={340}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
          <XAxis
            dataKey="age"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            interval="preserveStartEnd"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            tickFormatter={(v: number) => `${(v / 10000).toFixed(0)}万`}
            width={60}
          />
          <Tooltip
            formatter={(value: number) => [formatWan(value), '']}
            labelFormatter={(age: number) => `${age}${t('unitAge')}`}
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid rgba(148,163,184,0.2)',
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(8px)',
              fontSize: '13px',
            }}
          />
          {/* FIRE target horizontal line */}
          <ReferenceLine
            y={fireTarget}
            stroke="#f59e0b"
            strokeDasharray="6 4"
            label={{
              value: `${t('fireTarget')}: ${formatWan(fireTarget)}`,
              position: 'insideTopRight',
              fontSize: 12,
              fill: '#f59e0b',
            }}
          />
          {/* Retirement age vertical line */}
          <ReferenceLine
            x={params.retirementAge}
            stroke="#a855f7"
            strokeDasharray="6 4"
            label={{
              value: t('retirement'),
              position: 'insideTopLeft',
              fontSize: 12,
              fill: '#a855f7',
            }}
          />
          <Line
            type="monotone"
            dataKey="assets"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
