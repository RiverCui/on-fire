'use client';

import { useState, useMemo, useTransition } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  ReferenceDot,
  ResponsiveContainer,
} from 'recharts';
import { Slider } from '@/components/ui/slider';
import { useTranslations } from 'next-intl';
import { calculateFireCurve, calculateFireTarget } from '@/lib/fire-calc';
import type { FireParams } from '@/lib/fire-calc';
import { saveFirePlan, deleteFirePlan } from '@/actions/fireplan';
import { Save, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type FirePlanData = {
  id?: string;
  name?: string;
  annualIncome?: number;
  annualExpense?: number;
  expectedReturn?: number;
  inflationRate?: number;
  lifeExpectancy?: number;
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
  const [isPending, startTransition] = useTransition();
  const [planId, setPlanId] = useState<string | undefined>(firePlan?.id);
  const [planName, setPlanName] = useState(firePlan?.name ?? '');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [params, setParams] = useState<FireParams>({
    initialAssets: currentAssets || 500000,
    annualIncome: firePlan?.annualIncome ?? 300000,
    annualExpense: firePlan?.annualExpense ?? 120000,
    expectedReturn: firePlan?.expectedReturn ?? 0.07,
    inflationRate: firePlan?.inflationRate ?? 0.03,
    lifeExpectancy: firePlan?.lifeExpectancy ?? 90,
    currentAge: firePlan?.currentAge ?? 25,
    retirementAge: firePlan?.retirementAge ?? 45,
  });

  const { data, fireAge, depletedAge, assetsAtRetirement, totalWithdrawal } = useMemo(() => calculateFireCurve(params), [params]);
  const fireTarget = useMemo(
    () => calculateFireTarget(
      params.annualExpense, params.expectedReturn, params.inflationRate,
      params.currentAge, params.retirementAge, params.lifeExpectancy,
    ),
    [params.annualExpense, params.expectedReturn, params.inflationRate, params.currentAge, params.retirementAge, params.lifeExpectancy],
  );
  const yearsToRetirement = Math.max(params.retirementAge - params.currentAge, 0);
  const retirementExpense = useMemo(
    () => Math.round(params.annualExpense * Math.pow(1 + params.inflationRate, yearsToRetirement)),
    [params.annualExpense, params.inflationRate, yearsToRetirement],
  );
  const impliedWithdrawalRate = assetsAtRetirement > 0 ? retirementExpense / assetsAtRetirement : 0;
  const savingsRate = params.annualIncome > 0
    ? Math.round((params.annualIncome - params.annualExpense) / params.annualIncome * 100)
    : 0;

  const formatWan = (v: number) => `${(v / 10000).toFixed(0)}${t('unitWan')}`;
  const formatPercent = (v: number) => `${(v * 100).toFixed(1)}${t('unitPercent')}`;
  const formatAge = (v: number) => `${v}${t('unitAge')}`;

  const sliders: SliderConfig[] = [
    { key: 'initialAssets', min: -5000000, max: 10000000, step: 100000, format: formatWan },
    { key: 'annualIncome', min: 10000, max: 2000000, step: 10000, format: formatWan },
    { key: 'annualExpense', min: 10000, max: 2000000, step: 10000, format: formatWan },
    { key: 'expectedReturn', min: 0, max: 0.15, step: 0.005, format: formatPercent },
    { key: 'inflationRate', min: 0, max: 0.10, step: 0.005, format: formatPercent },
    { key: 'lifeExpectancy', min: 60, max: 100, step: 1, format: formatAge },
    { key: 'currentAge', min: 18, max: 60, step: 1, format: formatAge },
    { key: 'retirementAge', min: 30, max: 70, step: 1, format: formatAge },
  ];

  const handleChange = (key: keyof FireParams, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await saveFirePlan({
        id: planId,
        name: planName || t('planNamePlaceholder'),
        currentAge: params.currentAge,
        retirementAge: params.retirementAge,
        lifeExpectancy: params.lifeExpectancy,
        annualExpense: params.annualExpense,
        expectedReturn: params.expectedReturn,
        inflationRate: params.inflationRate,
      });
      if (result.success) {
        setPlanId(result.planId);
        setMessage({ type: 'success', text: planId ? t('updateSuccess') : t('saveSuccess') });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: result.message ?? 'Error' });
      }
    });
  };

  const handleDelete = () => {
    if (!planId) return;
    setMessage(null);
    startTransition(async () => {
      const result = await deleteFirePlan(planId);
      if (result.success) {
        setPlanId(undefined);
        setPlanName('');
        setShowDeleteConfirm(false);
        setMessage({ type: 'success', text: t('deleteSuccess') });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: result.message ?? 'Error' });
      }
    });
  };

  return (
    <div id="fire-simulator" className="space-y-6">
      {/* Slider Panel */}
      <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-4">
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

      {/* Key Metrics */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 dark:text-white/60">{t('savingsRate')}</span>
          <span className={`font-semibold ${savingsRate >= 50 ? 'text-emerald-600 dark:text-emerald-400' : savingsRate >= 25 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-500 dark:text-rose-400'}`}>
            {savingsRate}%
          </span>
        </div>
        <span className="text-slate-300 dark:text-white/20">|</span>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 dark:text-white/60">{t('annualSavingsLabel')}</span>
          <span className="font-semibold text-slate-900 dark:text-white">
            {formatWan(params.annualIncome - params.annualExpense)}
          </span>
        </div>
        <span className="text-slate-300 dark:text-white/20">|</span>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 dark:text-white/60">{t('retirementExpenseLabel')}</span>
          <span className="font-semibold text-slate-900 dark:text-white">
            {formatWan(retirementExpense)}
          </span>
        </div>
        <span className="text-slate-300 dark:text-white/20">|</span>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 dark:text-white/60">{t('fireAgeLabel')}</span>
          <span className={`font-semibold ${fireAge ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-white/40'}`}>
            {fireAge ? `${fireAge}${t('unitAge')}` : t('fireAgeNone')}
          </span>
        </div>
        <span className="text-slate-300 dark:text-white/20">|</span>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 dark:text-white/60">{t('assetsAtRetirement')}</span>
          <span className="font-semibold text-slate-900 dark:text-white">{formatWan(assetsAtRetirement)}</span>
        </div>
        <span className="text-slate-300 dark:text-white/20">|</span>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 dark:text-white/60">{t('impliedWithdrawalRate')}</span>
          <span className={`font-semibold ${impliedWithdrawalRate > 0 && impliedWithdrawalRate <= 0.04 ? 'text-emerald-600 dark:text-emerald-400' : impliedWithdrawalRate <= 0.05 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-500 dark:text-rose-400'}`}>
            {impliedWithdrawalRate > 0 ? `${(impliedWithdrawalRate * 100).toFixed(1)}%` : '-'}
          </span>
        </div>
        {depletedAge && (
          <>
            <span className="text-slate-300 dark:text-white/20">|</span>
            <div className="flex items-center gap-2">
              <span className="text-rose-500 dark:text-rose-400 font-semibold">
                {t('depletedWarning', { age: depletedAge })}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Negative savings warning */}
      {params.annualExpense >= params.annualIncome && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
          {t('negativeSavingsWarning')}
        </div>
      )}

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
          {/* Depleted zone shading */}
          {depletedAge && (
            <ReferenceArea
              x1={depletedAge}
              x2={params.lifeExpectancy}
              fill="#f43f5e"
              fillOpacity={0.06}
            />
          )}
          {/* FIRE achievement dot */}
          {fireAge && (
            <ReferenceDot
              x={fireAge}
              y={data.find((d) => d.age === fireAge)?.assets ?? 0}
              r={6}
              fill="#10b981"
              stroke="#fff"
              strokeWidth={2}
            />
          )}
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

      {/* Save / Update / Delete */}
      <div className="flex flex-wrap items-center gap-3 border-t border-slate-200/60 pt-5 dark:border-white/10">
        <input
          type="text"
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
          placeholder={t('planNamePlaceholder')}
          className="h-9 w-56 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/20 dark:border-white/20 dark:bg-white/10 dark:text-white dark:placeholder:text-white/40 dark:focus:ring-white/30"
        />
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isPending}
          className="gap-1.5 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white/90 dark:text-slate-900 dark:hover:bg-white"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {planId ? t('updatePlan') : t('savePlan')}
        </Button>
        {planId && !showDeleteConfirm && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowDeleteConfirm(true)}
            className="gap-1.5 text-slate-500 hover:text-rose-600 dark:text-white/50 dark:hover:text-rose-400"
          >
            <Trash2 className="h-4 w-4" />
            {t('deletePlan')}
          </Button>
        )}
        {showDeleteConfirm && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-rose-600 dark:text-rose-400">{t('deleteConfirm')}</span>
            <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isPending} className="h-7 px-2 text-xs">
              {t('deletePlan')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowDeleteConfirm(false)} className="h-7 px-2 text-xs">
              ✕
            </Button>
          </div>
        )}
        {message && (
          <span className={`text-sm ${message.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
            {message.text}
          </span>
        )}
      </div>
    </div>
  );
}
