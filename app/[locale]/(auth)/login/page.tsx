import Image from 'next/image';
import { BarChart3, ArrowLeftRight, Flame, Shield } from 'lucide-react';
import AuthForm from '@/components/auth/auth-form';
import { getTranslations } from 'next-intl/server';

const featureIcons = [BarChart3, ArrowLeftRight, Flame, Shield] as const;
const featureKeys = ['assets', 'cashflow', 'fire', 'security'] as const;

export default async function LoginPage() {
  const t = await getTranslations('AuthLoginPage');
  const brand = await getTranslations('AuthBrand');
  return (
    <div className="relative z-10 grid w-full max-w-5xl grid-cols-1 gap-8 rounded-2xl border border-slate-200/60 bg-white/80 p-6 shadow-2xl shadow-black/5 backdrop-blur-2xl sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 dark:border-white/[0.06] dark:bg-white/[0.03] dark:shadow-black/40">
      <div className="flex flex-col space-y-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Image src="/icon.png" alt="" width={44} height={44} className="rounded-xl shadow-lg shadow-black/20" />
          <span className="font-display text-xl tracking-[0.08em] text-slate-800 dark:text-white/90">
            {brand('name')}
          </span>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-medium leading-tight tracking-wide text-slate-900 dark:text-white">
            {t('heading')}
          </h1>
          <p className="text-sm leading-relaxed text-slate-500 dark:text-white/50">
            {t('description')}
          </p>
        </div>

        {/* Features */}
        <div className="space-y-3">
          {featureKeys.map((key, i) => {
            const Icon = featureIcons[i];
            return (
              <div key={key} className="group flex items-start gap-3 rounded-xl border border-transparent p-2.5 transition hover:border-slate-200/60 hover:bg-white/60 dark:hover:border-white/[0.06] dark:hover:bg-white/[0.03]">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-gradient-to-b from-white to-slate-50 shadow-sm dark:border-white/[0.08] dark:from-white/[0.06] dark:to-white/[0.02]">
                  <Icon className="h-4 w-4 text-slate-400 dark:text-white/40" />
                </div>
                <div className="pt-0.5">
                  <p className="text-sm font-medium text-slate-700 dark:text-white/80">{t(`features.${key}.title`)}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-400 dark:text-white/35">{t(`features.${key}.desc`)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AuthForm mode="login" />
    </div>
  );
}
