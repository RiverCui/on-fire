import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { ConversationItem } from './conversation-item';

type Conv = { id: string; title: string; updatedAt: Date };

export async function ConversationList({ conversations }: { conversations: Conv[] }) {
  const t = await getTranslations('Chat');
  return (
    <div className="flex flex-col gap-2 p-3">
      <Link
        href="/dashboard/chat"
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 dark:bg-white/90 dark:text-slate-900 dark:hover:bg-white"
      >
        <Plus className="h-4 w-4" />
        {t('newConversation')}
      </Link>
      <div className="mt-1 flex flex-col gap-1">
        {conversations.map((c) => (
          <ConversationItem key={c.id} id={c.id} title={c.title} />
        ))}
      </div>
    </div>
  );
}
