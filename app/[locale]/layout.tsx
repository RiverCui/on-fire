import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import '@/components/ui/global.css';
import { inter, notoSans, notoSerif } from '@/components/ui/fonts';
import { clsx } from 'clsx';
import { Locale, hasLocale, NextIntlClientProvider } from 'next-intl';
import { routing } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export async function generateMetadata(props: Omit<LayoutProps<'/[locale]'>, 'children'>): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'LocaleLayout' });
  return {
    title: {
      template: `%s | ${t('title')}`,
      default: t('title'),
    },
    description: t('description'),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<'/[locale]'>) {
  const { locale } = await params;
  if(!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  return (
    <html lang={locale}>
      <body className={clsx(inter.variable, notoSans.variable, notoSerif.variable, 'antialiased')}>
        <NextIntlClientProvider>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
