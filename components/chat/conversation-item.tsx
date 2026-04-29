'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { deleteConversation } from '@/actions/conversation';
import { cn } from '@/lib/utils';

export function ConversationItem({ id, title }: { id: string; title: string }) {
  const t = useTranslations('Chat');
  const params = useParams<{ locale: string; conversationId?: string }>();
  const router = useRouter();
  const [pending, start] = useTransition();
  const active = params.conversationId === id;

  const handleDelete = () => {
    if (!confirm(t('deleteConfirm'))) return;
    start(async () => {
      await deleteConversation(id);
      router.push(`/${params.locale}/dashboard/chat`);
    });
  };

  return (
    <div
      className={cn(
        'group flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors',
        active
          ? 'bg-slate-200 font-medium text-slate-900 backdrop-blur dark:bg-white/15 dark:text-white'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white',
      )}
    >
      <Link href={`/${params.locale}/dashboard/chat/${id}`} className="flex-1 truncate">
        {title}
      </Link>
      <button
        onClick={handleDelete}
        disabled={pending}
        className="ml-2 rounded-md p-1 text-slate-400 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100 disabled:opacity-50 dark:text-white/40 dark:hover:bg-rose-900/20 dark:hover:text-rose-400"
        aria-label="delete"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
