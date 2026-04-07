import AuthForm from '@/components/auth/auth-form';
import { getTranslations } from 'next-intl/server';

export default async function RegisterPage() {
  const t = await getTranslations('AuthRegisterPage');
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-12 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_60%)] dark:bg-[radial-gradient(circle_at_top,_rgba(250,250,250,0.15),_transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(14,165,233,0.15),_transparent_50%)] dark:bg-[radial-gradient(circle_at_bottom,_rgba(45,212,191,0.2),_transparent_50%)]" />
      <div className="relative z-10 grid w-full max-w-5xl grid-cols-1 gap-10 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-xl backdrop-blur-2xl lg:grid-cols-[1.1fr_0.9fr] dark:border-white/10 dark:bg-white/5">
        <div className="space-y-6">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500 dark:text-white/70">{t('brandLabel')}</p>
          <h1 className="text-3xl font-semibold leading-snug text-slate-900 dark:text-white">{t('heading')}</h1>
          <p className="text-sm text-slate-600 dark:text-white/70">
            {t('description')}
          </p>
        </div>
        <AuthForm mode="register" />
      </div>
    </div>
  );
}
