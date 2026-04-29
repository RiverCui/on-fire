'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useTranslations } from 'next-intl';
import { Rows3, Rows2 } from 'lucide-react';
import { MessageList } from './message-list';
import { ChatInput, type ChatInputHandle } from './chat-input';
import { EmptyState } from './empty-state';
import { ChatThemeContext, type ChatTheme } from './chat-theme-context';

type Props = {
  conversationId: string;
  initialMessages: UIMessage[];
};

export function ChatWindow({ conversationId, initialMessages }: Props) {
  const t = useTranslations('Chat');
  const [theme, setTheme] = useState<ChatTheme>('default');
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        body: { conversationId },
      }),
    [conversationId],
  );

  const { messages, sendMessage, stop, status } = useChat({
    transport,
    messages: initialMessages,
  });

  const streaming = status === 'submitted' || status === 'streaming';
  const isCompact = theme === 'compact';

  const inputHandleRef = useRef<ChatInputHandle>(null);

  const prevStreamingRef = useRef(streaming);
  useEffect(() => {
    if (prevStreamingRef.current && !streaming) {
      inputHandleRef.current?.focus();
    }
    prevStreamingRef.current = streaming;
  }, [streaming]);

  return (
    <ChatThemeContext.Provider value={theme}>
      <div className="flex h-full flex-col">
        {/* 顶部工具栏:紧凑/默认模式切换 */}
        <div className="flex items-center justify-end border-b border-slate-200/80 px-4 py-2 dark:border-white/10">
          <button
            type="button"
            onClick={() => setTheme((prev) => (prev === 'default' ? 'compact' : 'default'))}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-xs text-slate-700 backdrop-blur transition hover:bg-slate-50 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          >
            {isCompact ? <Rows2 className="h-3.5 w-3.5" /> : <Rows3 className="h-3.5 w-3.5" />}
            {isCompact ? t('defaultMode') : t('compactMode')}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <EmptyState onPick={(text) => sendMessage({ text })} />
          ) : (
            <MessageList messages={messages} streaming={streaming} />
          )}
        </div>
        <ChatInput
          ref={inputHandleRef}
          onSend={(text) => sendMessage({ text })}
          onStop={stop}
          streaming={streaming}
        />
      </div>
    </ChatThemeContext.Provider>
  );
}
