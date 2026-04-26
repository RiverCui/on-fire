import { redirect } from 'next/navigation';
import { listConversations, createConversation } from '@/actions/conversation';

export default async function ChatIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const convs = await listConversations();
  const target = convs[0]?.id ?? (await createConversation()).id;
  redirect(`/${locale}/chat/${target}`);
}
