import { auth } from '@/auth';
import { getTranslations } from 'next-intl/server';
import { User, Mail } from 'lucide-react';

export default async function SettingsPage() {
  const glassCard =
    'rounded-3xl border border-slate-200 bg-white/80 p-6 text-slate-900 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:text-white';
  const t = await getTranslations('SettingsPage');
  const session = await auth();
  const user = session?.user;
  const initial = user?.name?.[0]?.toUpperCase() ?? '?';

  return (
    <div className="space-y-8 text-slate-900 dark:text-white">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-500 dark:text-white/60">{t('title')}</p>
        <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">{t('description')}</h2>
      </div>

      <div className={`${glassCard} flex flex-col gap-4 md:flex-row md:items-center md:justify-between`}>
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-lg font-semibold text-white shadow-sm dark:bg-white/15">
            {initial}
          </div>
          <div>
            <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-white/60">{t('profile.title')}</p>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{user?.name || 'Guest'}</h3>
            <p className="text-sm text-slate-600 dark:text-white/70">{user?.email || '-'}</p>
          </div>
        </div>

        <div className="grid w-full gap-3 md:w-auto md:grid-cols-2">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/5">
            <User className="h-5 w-5 text-slate-500 dark:text-white/70" />
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-white/60">{t('profile.name')}</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.name || 'Guest'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/5">
            <Mail className="h-5 w-5 text-slate-500 dark:text-white/70" />
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-white/60">{t('profile.email')}</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.email || '-'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
