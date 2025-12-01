import { Inter, Noto_Sans_SC, Noto_Serif_SC } from 'next/font/google';

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const notoSans = Noto_Sans_SC({
  subsets: ['latin'],
  variable: '--font-noto-sans',
  weight: ['400', '500', '700'],
  display: 'swap',
})

export const notoSerif = Noto_Serif_SC({
  subsets: ['latin'],
  variable: '--font-noto-serif',
  weight: ['400', '500', '700'],
  display: 'swap',
})
