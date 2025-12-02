"use client";

import { useEffect, useState } from 'react';
import { ArrowUpRight, PiggyBank, Wallet, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const glassCard =
  'rounded-3xl border border-white/10 bg-white/60 p-6 text-slate-900 shadow-lg backdrop-blur-xl';

const recentFlows = [
  { label: '工资收入', amount: '+￥25,000', date: '11月 28日', positive: true },
  { label: 'ETF 定投', amount: '-￥5,000', date: '11月 26日', positive: false },
  { label: '副业收入', amount: '+￥3,800', date: '11月 24日', positive: true },
];

export default function Page() {
  const [progress, setProgress] = useState(12);
  useEffect(() => {
    const timer = setTimeout(() => setProgress(68), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 md:grid-cols-3">
        {[
          {
            label: '当前净资产',
            value: '¥ 1,280,000',
            change: '+3.2%',
            icon: Wallet,
          },
          {
            label: '储蓄率',
            value: '52%',
            change: '+5% YoY',
            icon: PiggyBank,
          },
          {
            label: '可支配现金',
            value: '¥ 86,200',
            change: '稳定',
            icon: Zap,
          },
        ].map((item) => (
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
              <p className="text-sm text-slate-500">FIRE 进度</p>
              <h3 className="text-2xl font-semibold">朝着 500 万自由资产迈进</h3>
            </div>
            <span className="rounded-full bg-slate-900/80 px-3 py-1 text-xs text-white">目标 68%</span>
          </div>
          <Progress value={progress} className="h-3 w-full rounded-full bg-white/50">
            <span />
          </Progress>
          <div className="flex flex-wrap gap-6 text-sm text-slate-600">
            <div>
              <p className="text-xs uppercase tracking-wide">已积累</p>
              <p className="text-lg font-semibold text-slate-900">¥ 3,400,000</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide">目标</p>
              <p className="text-lg font-semibold text-slate-900">¥ 5,000,000</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide">预测自由日</p>
              <p className="text-lg font-semibold text-slate-900">2032 · Q1</p>
            </div>
          </div>
        </div>
        <div className={`${glassCard} space-y-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">现金流动态</p>
              <h3 className="text-xl font-semibold">最近 7 日</h3>
            </div>
            <button className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900">
              查看全部 <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
          <ul className="space-y-4">
            {recentFlows.map((flow) => (
              <li key={flow.label} className="flex items-center justify-between rounded-2xl border border-slate-200/60 bg-white/70 px-4 py-3">
                <div>
                  <p className="font-medium text-slate-900">{flow.label}</p>
                  <p className="text-xs text-slate-500">{flow.date}</p>
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
          <p className="text-sm text-slate-500">资产配置</p>
          <h3 className="text-xl font-semibold text-slate-900">多账户，多币种</h3>
          <p className="mt-3 text-sm text-slate-600">
            银行、券商、基金、数字资产甚至是房产抵押，都可以统一纳入，支持 API 接入与手动更新。
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>· 股票：40% · 长期增长组合</li>
            <li>· 现金：25% · 流动资金池</li>
            <li>· 债券：20% · 稳健收益</li>
            <li>· 其他：15% · 加密 & 房产</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-white/40 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-2xl">
          <p className="text-xs uppercase tracking-[0.4em] text-white/70">Next Step</p>
          <h3 className="mt-3 text-2xl font-semibold">更新 12 月收入与 ETF 定投计划</h3>
          <p className="mt-3 text-sm text-white/70">
            本月支出已控制在预算范围。建议保持 50% 以上储蓄率，并将新增资金投入多资产组合。
          </p>
          <button className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-medium text-slate-900">
            去记录
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
