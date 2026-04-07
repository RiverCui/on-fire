import type { ReactNode } from 'react';
import { Bell, Sparkles } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ui/theme-toggle';
import SideNav from '@/components/dashboard/sidenav';
import LangSwitcher from '@/components/dashboard/lang-switcher';

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function Layout({ children }: DashboardLayoutProps) {
  const t = await getTranslations('DashboardLayout');
  return (
    <div className="relative flex h-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      {/* 背景渐变效果 */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.06),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(250,250,250,0.1),_transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.12),_transparent_60%)] dark:bg-[radial-gradient(circle_at_bottom_right,_rgba(45,212,191,0.15),_transparent_60%)]" />

      {/* 侧边栏 */}
      <aside className="relative z-10 hidden h-screen flex-shrink-0 border-r border-slate-200/80 bg-white/80 backdrop-blur-xl md:flex md:w-64 md:flex-col dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center gap-3 border-b border-slate-200/80 px-6 py-6 dark:border-white/10">
          <span className="text-3xl">🔥</span>
          <div>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">{t('brandName')}</p>
            <p className="text-xs text-slate-600 dark:text-white/60">{t('brandTagline')}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SideNav />
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <header className="border-b border-slate-200/70 bg-white/70 px-6 py-5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500 dark:text-white/70">{t('welcomeBack')}</p>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{t('dashboardTitle')}</h1>
              <p className="text-sm text-slate-600 dark:text-white/70">
                {t('dashboardSubtitle')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <LangSwitcher />
              <ThemeToggle />
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0 border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
              >
                <Bell className="h-4 w-4" />
                <span className="sr-only">{t('notificationsButton')}</span>
              </Button>
              <Button
                size="sm"
                className="shrink-0 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white/90 dark:text-slate-900 dark:hover:bg-white"
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
