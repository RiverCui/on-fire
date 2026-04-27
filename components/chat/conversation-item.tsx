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
      router.push(`/${params.locale}/chat`);
    });
  };

  return (
    <div
      className={cn(
        'group flex items-center justify-between rounded-md px-3 py-2 text-sm',
        active ? 'bg-accent' : 'hover:bg-accent/50',
      )}
    >
      <Link href={`/${params.locale}/chat/${id}`} className="truncate flex-1">
        {title}
      </Link>
      <button
        onClick={handleDelete}
        disabled={pending}
        className="ml-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
        aria-label="delete"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
