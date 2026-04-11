'use client';

import { useActionState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import {
  AtSign,
  CircleAlert,
  Key,
  User,
} from 'lucide-react';

import { authenticate, register } from '@/actions/auth';
import { Button } from '@/components/ui/button';

type AuthFormMode = 'login' | 'register';

interface AuthFormProps {
  mode: AuthFormMode;
}

const oauthProviders = [
  { id: 'google', labelKey: 'oauth.google' },
  { id: 'github', labelKey: 'oauth.github' },
] as const;

const inputClass =
  'peer block w-full rounded-lg border border-slate-200/80 bg-white/60 py-2.5 pl-10 pr-3 text-sm backdrop-blur placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200/60 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/30 dark:focus:border-white/15 dark:focus:ring-white/[0.06]';

const iconClass =
  'pointer-events-none absolute left-3 top-1/2 h-[16px] w-[16px] -translate-y-1/2 text-slate-300 peer-focus:text-slate-500 dark:text-white/25 dark:peer-focus:text-white/50';

export default function AuthForm({ mode }: AuthFormProps) {
  const t = useTranslations('AuthForm');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const action = mode === 'login' ? authenticate : register;
  const [errorMessage, formAction, isPending] = useActionState(action, undefined);

  const switchHref = mode === 'login' ? `/${locale}/register` : `/${locale}/login`;
  const switchLabel =
    mode === 'login' ? t('switchPrompt.noAccount') : t('switchPrompt.haveAccount');
  const switchCta =
    mode === 'login' ? t('switchPrompt.createAccount') : t('switchPrompt.logIn');

  return (
    <form action={formAction}>
      <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-7 shadow-xl shadow-black/[0.03] backdrop-blur-xl dark:border-white/[0.06] dark:bg-white/[0.04] dark:shadow-black/30">
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white/90">
            {mode === 'login' ? t('titles.login') : t('titles.register')}
          </h2>
          <p className="text-xs text-slate-400 dark:text-white/40">
            {mode === 'login' ? t('subtitles.login') : t('subtitles.register')}
          </p>
        </div>

        <div className="mt-5 space-y-4">
          {mode === 'register' && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-white/50" htmlFor="name">
                {t('nameLabel')}
              </label>
              <div className="relative">
                <input className={inputClass} id="name" name="name" type="text" placeholder={t('namePlaceholder')} required minLength={2} />
                <User className={iconClass} />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-white/50" htmlFor="email">
              {t('emailLabel')}
            </label>
            <div className="relative">
              <input className={inputClass} id="email" type="email" name="email" placeholder={t('emailPlaceholder')} required />
              <AtSign className={iconClass} />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-white/50" htmlFor="password">
              {t('passwordLabel')}
            </label>
            <div className="relative">
              <input className={inputClass} id="password" type="password" name="password" placeholder={t('passwordPlaceholder')} required minLength={6} />
              <Key className={iconClass} />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-white/50" htmlFor="confirmPassword">
                {t('confirmPasswordLabel')}
              </label>
              <div className="relative">
                <input className={inputClass} id="confirmPassword" type="password" name="confirmPassword" placeholder={t('confirmPasswordPlaceholder')} required minLength={6} />
                <Key className={iconClass} />
              </div>
            </div>
          )}
        </div>

        <input type="hidden" name="redirectTo" value={callbackUrl} />
        <Button
          className="mt-5 w-full rounded-lg border border-slate-700 bg-slate-800 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-slate-400 dark:border-white/[0.12] dark:bg-white/[0.14] dark:backdrop-blur dark:hover:bg-white/[0.18]"
          aria-disabled={isPending}
        >
          {mode === 'login' ? t('submit.login') : t('submit.register')}
        </Button>

        <div className="flex h-8 items-end space-x-1 text-xs text-red-500" aria-live="polite" aria-atomic="true">
          {errorMessage && (
            <>
              <CircleAlert className="h-4 w-4" />
              <p>{errorMessage}</p>
            </>
          )}
        </div>

        <div className="text-center text-xs text-slate-400 dark:text-white/40">
          {switchLabel}{' '}
          <Link href={switchHref} className="font-medium text-slate-700 hover:underline dark:text-white/70">
            {switchCta}
          </Link>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200/60 dark:bg-white/[0.06]" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-300 dark:text-white/25">
            {t('oauthDivider')}
          </span>
          <div className="h-px flex-1 bg-slate-200/60 dark:bg-white/[0.06]" />
        </div>
        <div className="mt-4 grid gap-2.5">
          {oauthProviders.map(({ id, labelKey }) => (
            <Button
              key={id}
              type="button"
              variant="outline"
              className="w-full rounded-lg border border-slate-200/80 bg-white/50 text-sm text-slate-600 backdrop-blur transition hover:bg-white/80 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/60 dark:hover:bg-white/[0.07]"
              onClick={() => signIn(id, { callbackUrl })}
            >
              {t(labelKey)}
            </Button>
          ))}
        </div>
      </div>
    </form>
  );
}
