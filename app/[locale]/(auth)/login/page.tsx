import LoginForm from '@/components/auth/login-form';
import { getTranslations } from 'next-intl/server';

export default async function LoginPage() {
  const t = await getTranslations('AuthLoginPage');
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(250,250,250,0.15),_transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(45,212,191,0.2),_transparent_50%)]" />
      <div className="relative z-10 grid w-full max-w-5xl grid-cols-1 gap-10 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-2xl lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <p className="text-xs uppercase tracking-[0.4em] text-white/70">{t('brandLabel')}</p>
          <h1 className="text-3xl font-semibold leading-snug text-white">{t('heading')}</h1>
          <p className="text-sm text-white/70">
            {t('description')}
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/70 p-8 text-slate-900 shadow-2xl backdrop-blur">
          <h2 className="text-xl font-semibold">{t('formTitle')}</h2>
          <p className="mt-1 text-sm text-slate-500">{t('formSubtitle')}</p>
          <div className="mt-6">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
