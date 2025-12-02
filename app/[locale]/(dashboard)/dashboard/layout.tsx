import type { ReactNode } from 'react';
import { Bell, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SideNav from '@/components/dashboard/sidenav';

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside className="hidden border-r border-slate-200 bg-white md:flex md:w-64 md:flex-col">
        <div className="flex items-center gap-3 px-6 py-6">
          <span className="text-3xl">🔥</span>
          <div>
            <p className="text-lg font-semibold">FIRE Master</p>
            <p className="text-xs text-slate-500">掌控资产 · 量化自由</p>
          </div>
        </div>
        <div>
          <SideNav />
        </div>
        <div className="m-4 rounded-2xl bg-slate-900 p-4 text-white">
          <p className="text-sm font-semibold">今日 FIRE 指标</p>
          <p className="mt-1 text-xs text-slate-200">记录今日储蓄率，保持复利节奏。</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-4 w-full bg-white text-slate-900 hover:bg-slate-100"
          >
            快速记一笔
          </Button>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="border-b border-slate-200 bg-white px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">欢迎回来</p>
              <h1 className="text-2xl font-semibold text-slate-900">你的 FIRE 仪表盘</h1>
              <p className="text-sm text-slate-500">
                每一次记录都是向自由迈进的一步，今天也保持 50% 的储蓄率吧。
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="border-slate-200 text-slate-600">
                <Bell className="h-4 w-4" />
                通知
              </Button>
              <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-900/90">
                <Sparkles className="h-4 w-4" />
                新建计划
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
