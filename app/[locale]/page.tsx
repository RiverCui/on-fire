import { redirect } from 'next/navigation';

export default async function LocalePage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard`);
}