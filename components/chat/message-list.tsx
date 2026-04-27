'use client';

import { useEffect, useRef } from 'react';
import type { UIMessage } from 'ai';
import { useTranslations } from 'next-intl';
import { MessageBubble } from './message-bubble';

export function MessageList({
  messages,
  streaming,
}: {
  messages: UIMessage[];
  streaming: boolean;
}) {
  const t = useTranslations('Chat');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  return (
    <div className="flex flex-col gap-3 p-4">
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} />
      ))}
      {streaming && (
        <div className="text-xs text-muted-foreground">{t('thinking')}</div>
      )}
      <div ref={endRef} />
    </div>
  );
}
