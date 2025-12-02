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
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside className="hidden border-r border-slate-200 bg-white md:flex md:w-64 md:flex-col">
        <div className="flex items-center gap-3 px-6 py-6">
          <span className="text-3xl">🔥</span>
          <div>
            <p className="text-lg font-semibold">{t('brandName')}</p>
            <p className="text-xs text-slate-500">{t('brandTagline')}</p>
          </div>
        </div>
        <div>
          <SideNav />
        </div>
        <div className="m-4 rounded-2xl bg-slate-900 p-4 text-white">
          <p className="text-sm font-semibold">{t('dailyMetricsTitle')}</p>
          <p className="mt-1 text-xs text-slate-200">{t('dailyMetricsSubtitle')}</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-4 w-full bg-white text-slate-900 hover:bg-slate-100"
          >
            {t('dailyMetricsButton')}
          </Button>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="border-b border-slate-200 bg-white px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">{t('welcomeBack')}</p>
              <h1 className="text-2xl font-semibold text-slate-900">{t('dashboardTitle')}</h1>
              <p className="text-sm text-slate-500">
                {t('dashboardSubtitle')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <LangSwitcher />
              <Button variant="outline" size="sm" className="border-slate-200 text-slate-600">
                <Bell className="h-4 w-4" />
                {t('notificationsButton')}
              </Button>
              <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-900/90">
                <Sparkles className="h-4 w-4" />
                {t('newPlanButton')}
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
