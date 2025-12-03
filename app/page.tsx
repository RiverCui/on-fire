import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params;
  const session = await auth();
  const destination = session?.user ? 'dashboard' : 'login';

  redirect(`/${locale}/${destination}`);
}
