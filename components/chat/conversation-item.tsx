'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { deleteConversation, renameConversation } from '@/actions/conversation';
import { cn } from '@/lib/utils';

export function ConversationItem({ id, title }: { id: string; title: string }) {
  const t = useTranslations('Chat');
  const params = useParams<{ locale: string; conversationId?: string }>();
  const router = useRouter();
  const [pending, start] = useTransition();
  const active = params.conversationId === id;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(title);
  }, [title, editing]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    const next = draft.trim();
    setEditing(false);
    if (!next || next === title) return;
    start(async () => {
      try {
        await renameConversation(id, next);
        router.refresh();
      } catch (err) {
        console.error('[chat] rename failed', err);
        setDraft(title);
      }
    });
  };

  const cancel = () => {
    setDraft(title);
    setEditing(false);
  };

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
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              cancel();
            }
          }}
          maxLength={50}
          aria-label={t('renameLabel')}
          className="flex-1 truncate rounded-md border border-slate-300 bg-white px-1.5 py-0.5 text-sm outline-none focus:border-slate-500 dark:border-white/20 dark:bg-white/10 dark:text-white"
        />
      ) : (
        <Link
          href={`/${params.locale}/dashboard/chat/${id}`}
          onDoubleClick={(e) => {
            e.preventDefault();
            setEditing(true);
          }}
          className="flex-1 truncate"
          title={t('renameHint')}
        >
          {title}
        </Link>
      )}
      <button
        onClick={handleDelete}
        disabled={pending || editing}
        className="ml-2 rounded-md p-1 text-slate-400 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100 disabled:opacity-50 dark:text-white/40 dark:hover:bg-rose-900/20 dark:hover:text-rose-400"
        aria-label="delete"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
