import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ConversationItem } from './conversation-item';

type Conv = { id: string; title: string; updatedAt: Date };

export async function ConversationList({ conversations }: { conversations: Conv[] }) {
  const t = await getTranslations('Chat');
  return (
    <div className="flex flex-col gap-1 p-2">
      <Link
        href="/dashboard/chat"
        className="rounded-md px-3 py-2 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90"
      >
        + {t('newConversation')}
      </Link>
      <div className="mt-2 flex flex-col gap-0.5">
        {conversations.map((c) => (
          <ConversationItem key={c.id} id={c.id} title={c.title} />
        ))}
      </div>
    </div>
  );
}
