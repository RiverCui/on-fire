import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { listConversations } from '@/actions/conversation';
import { ConversationList } from '@/components/chat/conversation-list';

export default async function ChatLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations('Chat');
  const conversations = await listConversations();
  return (
    <div className="flex h-[calc(100vh-4rem)] w-full gap-4">
      <main className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white/70 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
        {children}
      </main>
      <aside className="hidden w-72 shrink-0 flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white/70 shadow-sm backdrop-blur-xl md:flex dark:border-white/10 dark:bg-white/5">
        <div className="border-b border-slate-200/80 px-5 py-4 dark:border-white/10">
          <p className="text-xs uppercase tracking-widest text-slate-400 dark:text-white/40">
            {t('title')}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
            {t('newConversation')}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ConversationList conversations={conversations} />
        </div>
      </aside>
    </div>
  );
}
