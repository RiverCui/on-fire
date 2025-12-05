'use client';

import { useActionState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import {
  AtSymbolIcon,
  ExclamationCircleIcon,
  KeyIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { ArrowRightIcon } from '@heroicons/react/20/solid';

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
    <form action={formAction} className="space-y-4">
      <div className="flex-1 rounded-3xl border border-white/10 bg-white/70 p-8 text-slate-900 shadow-2xl backdrop-blur">
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold">
            {mode === 'login' ? t('titles.login') : t('titles.register')}
          </h1>
          <p className="text-sm text-slate-500">
            {mode === 'login' ? t('subtitles.login') : t('subtitles.register')}
          </p>
        </div>

        <div className="mt-6 space-y-4">
          {mode === 'register' && (
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-600" htmlFor="name">
                {t('nameLabel')}
              </label>
              <div className="relative">
                <input
                  className="peer block w-full rounded-md border border-slate-200 py-[9px] pl-10 pr-3 text-sm outline-2 placeholder:text-slate-400"
                  id="name"
                  name="name"
                  type="text"
                  placeholder={t('namePlaceholder')}
                  required
                  minLength={2}
                />
                <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 peer-focus:text-slate-900" />
              </div>
            </div>
          )}

          <div>
            <label className="mb-2 block text-xs font-medium text-slate-600" htmlFor="email">
              {t('emailLabel')}
            </label>
            <div className="relative">
              <input
                className="peer block w-full rounded-md border border-slate-200 py-[9px] pl-10 pr-3 text-sm outline-2 placeholder:text-slate-400"
                id="email"
                type="email"
                name="email"
                placeholder={t('emailPlaceholder')}
                required
              />
              <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 peer-focus:text-slate-900" />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-slate-600" htmlFor="password">
              {t('passwordLabel')}
            </label>
            <div className="relative">
              <input
                className="peer block w-full rounded-md border border-slate-200 py-[9px] pl-10 pr-3 text-sm outline-2 placeholder:text-slate-400"
                id="password"
                type="password"
                name="password"
                placeholder={t('passwordPlaceholder')}
                required
                minLength={6}
              />
              <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 peer-focus:text-slate-900" />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label
                className="mb-2 block text-xs font-medium text-slate-600"
                htmlFor="confirmPassword"
              >
                {t('confirmPasswordLabel')}
              </label>
              <div className="relative">
                <input
                  className="peer block w-full rounded-md border border-slate-200 py-[9px] pl-10 pr-3 text-sm outline-2 placeholder:text-slate-400"
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  placeholder={t('confirmPasswordPlaceholder')}
                  required
                  minLength={6}
                />
                <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 peer-focus:text-slate-900" />
              </div>
            </div>
          )}
        </div>

        <input type="hidden" name="redirectTo" value={callbackUrl} />
        <Button
          className="mt-6 w-full rounded-2xl border border-white/20 bg-slate-900/80 py-3 text-base font-semibold text-white shadow-lg shadow-black/10 transition hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/40"
          aria-disabled={isPending}
        >
          {mode === 'login' ? t('submit.login') : t('submit.register')}
          <ArrowRightIcon className="ml-auto h-5 w-5 text-white" />
        </Button>

        <div
          className="flex h-8 items-end space-x-1 text-sm text-red-500"
          aria-live="polite"
          aria-atomic="true"
        >
          {errorMessage && (
            <>
              <ExclamationCircleIcon className="h-5 w-5" />
              <p>{errorMessage}</p>
            </>
          )}
        </div>

        <div className="mt-2 text-center text-sm text-slate-600">
          {switchLabel}{' '}
          <Link href={switchHref} className="font-semibold text-slate-900/80 hover:underline">
            {switchCta}
          </Link>
        </div>

        <div className="mt-6 space-y-4 rounded-2xl border border-white/15 p-4 bg-white/10">
          <div className="text-center text-xs uppercase tracking-[0.3em] text-slate-800">
            {t('oauthDivider')}
          </div>
          <div className="grid gap-3">
            {oauthProviders.map(({ id, labelKey }) => (
              <Button
                key={id}
                type="button"
                variant="outline"
                className="w-full border border-slate-200 bg-transparent text-slate-900/80 transition hover:bg-white"
                onClick={() => signIn(id, { callbackUrl })}
              >
                {t(labelKey)}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </form>
  );
}
