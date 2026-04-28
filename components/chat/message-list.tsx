'use client';

import type { UIMessage } from 'ai';
import { useTranslations } from 'next-intl';
import { MessageBubble } from './message-bubble';
import { useScrollToBottom } from '@/hooks/use-scroll-to-bottom';

export function MessageList({
  messages,
  streaming,
}: {
  messages: UIMessage[];
  streaming: boolean;
}) {
  const t = useTranslations('Chat');
  const endRef = useScrollToBottom(messages, streaming);

  return (
    <div className="flex flex-col gap-4 px-4 py-6 sm:px-6">
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} />
      ))}
      {streaming && (
        <div className="animate-pulse text-xs text-slate-500 dark:text-white/50">
          {t('thinking')}
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
