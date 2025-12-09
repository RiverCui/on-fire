import { auth } from '@/auth';
import { getTranslations } from 'next-intl/server';
import { User, Mail } from 'lucide-react';

export default async function SettingsPage() {
  const t = await getTranslations('SettingsPage');
  const session = await auth();
  const user = session?.user;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">{t('title')}</h2>
        <p className="text-sm text-slate-500">{t('description')}</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-medium text-slate-900">{t('profile.title')}</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4 rounded-lg bg-slate-50 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-slate-500">
              <User className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{t('profile.name')}</p>
              <p className="font-semibold text-slate-900">{user?.name || 'Guest'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 rounded-lg bg-slate-50 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-slate-500">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{t('profile.email')}</p>
              <p className="font-semibold text-slate-900">{user?.email || '-'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}