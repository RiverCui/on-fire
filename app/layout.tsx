import { ReactNode } from 'react';
import { clsx } from 'clsx';
import { getLocale } from 'next-intl/server';
import '@/components/ui/global.css';
import { inter, notoSans, notoSerif, playfair } from '@/components/ui/fonts';

type Props = {
  children: ReactNode;
}

export default async function RootLayout({ children }: Props) {
  const locale = await getLocale();
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme')||'dark';document.documentElement.classList.toggle('dark',t==='dark');document.documentElement.dataset.theme=t}catch(e){document.documentElement.classList.add('dark')}})()`,
          }}
        />
      </head>
      <body className={clsx(inter.variable, notoSans.variable, notoSerif.variable, playfair.variable, 'font-sans antialiased')}>
        {children}
      </body>
    </html>
  );
}
