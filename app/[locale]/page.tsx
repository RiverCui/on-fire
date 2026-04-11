import { redirect } from '@/i18n/navigation';
import { auth } from '@/auth';

export default async function LocalePage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params;
  const session = await auth();
  const destination = session?.user ? 'dashboard' : 'login';

  redirect({ href: `/${destination}`, locale });
}
