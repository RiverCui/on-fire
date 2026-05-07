'use client';

import { useState, useMemo, useRef, useEffect, useTransition } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Rows3, Rows2 } from 'lucide-react';
import { MessageList } from './message-list';
import { ChatInput, type ChatInputHandle } from './chat-input';
import { EmptyState } from './empty-state';
import { ChatThemeContext, type ChatTheme } from './chat-theme-context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateConversationProvider } from '@/actions/conversation';
import { VALID_PROVIDERS, type AIProvider } from '@/lib/ai/provider';

type Props = {
  conversationId: string;
  initialProvider: AIProvider | null;
  initialMessages: UIMessage[];
};

const PROVIDER_LABEL: Record<AIProvider, string> = {
  deepseek: 'DeepSeek',
  anthropic: 'Claude',
  openai: 'GPT',
};

export function ChatWindow({ conversationId, initialProvider, initialMessages }: Props) {
  const t = useTranslations('Chat');
  const router = useRouter();
  const [theme, setTheme] = useState<ChatTheme>('default');
  const [provider, setProvider] = useState<AIProvider | null>(initialProvider);
  const [, startTransition] = useTransition();
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
  const providerLocked = messages.length > 0;
  const currentProvider: AIProvider = provider ?? 'deepseek';

  const handleProviderChange = (next: string) => {
    if (!(VALID_PROVIDERS as readonly string[]).includes(next)) return;
    const nextProvider = next as AIProvider;
    const prev = provider;
    setProvider(nextProvider); // optimistic
    startTransition(async () => {
      try {
        await updateConversationProvider(conversationId, nextProvider);
      } catch (err) {
        console.error('[chat] provider switch failed', err);
        setProvider(prev); // revert
      }
    });
  };

  const inputHandleRef = useRef<ChatInputHandle>(null);

  const prevStreamingRef = useRef(streaming);
  useEffect(() => {
    if (prevStreamingRef.current && !streaming) {
      inputHandleRef.current?.focus();
      // Pull the latest sidebar (auto-generated title shows up on first exchange).
      router.refresh();
    }
    prevStreamingRef.current = streaming;
  }, [streaming, router]);

  return (
    <ChatThemeContext.Provider value={theme}>
      <div className="flex h-full flex-col">
        {/* 顶部工具栏:provider 切换 + 紧凑/默认模式 */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 px-4 py-2 dark:border-white/10">
          <Select
            value={currentProvider}
            onValueChange={handleProviderChange}
            disabled={providerLocked}
          >
            <SelectTrigger
              className="h-7 w-32 rounded-full text-xs"
              title={providerLocked ? t('providerLockedHint') : t('providerHint')}
              aria-label={t('providerLabel')}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VALID_PROVIDERS.map((p) => (
                <SelectItem key={p} value={p} className="text-xs">
                  {PROVIDER_LABEL[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
