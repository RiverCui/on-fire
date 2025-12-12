import type { ReactNode } from 'react';
import { Bell, Sparkles } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import SideNav from '@/components/dashboard/sidenav';
import LangSwitcher from '@/components/dashboard/lang-switcher';

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function Layout({ children }: DashboardLayoutProps) {
  const t = await getTranslations('DashboardLayout');
  return (
    <div className="relative flex h-screen overflow-hidden bg-slate-950 text-white">
      {/* 背景渐变效果 */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(250,250,250,0.1),_transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(45,212,191,0.15),_transparent_60%)]" />

      {/* 侧边栏 */}
      <aside className="relative z-10 hidden h-screen flex-shrink-0 border-r border-white/10 bg-white/5 backdrop-blur-xl md:flex md:w-64 md:flex-col">
        <div className="flex items-center gap-3 border-b border-white/10 px-6 py-6">
          <span className="text-3xl">🔥</span>
          <div>
            <p className="text-lg font-semibold text-white">{t('brandName')}</p>
            <p className="text-xs text-white/60">{t('brandTagline')}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SideNav />
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <header className="border-b border-white/10 bg-white/5 px-6 py-5 backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/70">{t('welcomeBack')}</p>
              <h1 className="text-2xl font-semibold text-white">{t('dashboardTitle')}</h1>
              <p className="text-sm text-white/70">
                {t('dashboardSubtitle')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <LangSwitcher />
              <Button variant="outline" size="sm" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                <Bell className="h-4 w-4" />
                {t('notificationsButton')}
              </Button>
              <Button
                size="sm"
                className="bg-white/90 text-slate-900 hover:bg-white"
                data-tour="new-plan-button"
              >
                <Sparkles className="h-4 w-4" />
                {t('newPlanButton')}
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
