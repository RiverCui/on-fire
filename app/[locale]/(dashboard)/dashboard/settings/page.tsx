import { auth } from '@/auth';
import { getTranslations } from 'next-intl/server';
import { User, Mail } from 'lucide-react';

export default async function SettingsPage() {
  const glassCard =
    'rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-lg backdrop-blur-xl';
  const t = await getTranslations('SettingsPage');
  const session = await auth();
  const user = session?.user;
  const initial = user?.name?.[0]?.toUpperCase() ?? '?';

  return (
    <div className="space-y-8 text-white">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.35em] text-white/60">{t('title')}</p>
        <h2 className="text-3xl font-semibold text-white">{t('description')}</h2>
      </div>

      <div className={`${glassCard} flex flex-col gap-4 md:flex-row md:items-center md:justify-between`}>
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-lg font-semibold text-white">
            {initial}
          </div>
          <div>
            <p className="text-sm uppercase tracking-wide text-white/60">{t('profile.title')}</p>
            <h3 className="text-xl font-semibold text-white">{user?.name || 'Guest'}</h3>
            <p className="text-sm text-white/70">{user?.email || '-'}</p>
          </div>
        </div>

        <div className="grid w-full gap-3 md:w-auto md:grid-cols-2">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <User className="h-5 w-5 text-white/70" />
            <div>
              <p className="text-xs uppercase tracking-wide text-white/60">{t('profile.name')}</p>
              <p className="text-sm font-semibold text-white">{user?.name || 'Guest'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <Mail className="h-5 w-5 text-white/70" />
            <div>
              <p className="text-xs uppercase tracking-wide text-white/60">{t('profile.email')}</p>
              <p className="text-sm font-semibold text-white">{user?.email || '-'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
