'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import { EmptyState } from './empty-state';

type Props = {
  conversationId: string;
  initialMessages: UIMessage[];
};

export function ChatWindow({ conversationId, initialMessages }: Props) {
  const { messages, sendMessage, stop, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { conversationId },
    }),
    messages: initialMessages,
  });

  const streaming = status === 'submitted' || status === 'streaming';

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyState onPick={(text) => sendMessage({ text })} />
        ) : (
          <MessageList messages={messages} streaming={streaming} />
        )}
      </div>
      <ChatInput
        onSend={(text) => sendMessage({ text })}
        onStop={stop}
        streaming={streaming}
      />
    </div>
  );
}
