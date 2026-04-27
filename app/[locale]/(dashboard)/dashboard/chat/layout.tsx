import type { ReactNode } from 'react';
import { listConversations } from '@/actions/conversation';
import { ConversationList } from '@/components/chat/conversation-list';

export default async function ChatLayout({ children }: { children: ReactNode }) {
  const conversations = await listConversations();
  return (
    <div className="flex h-[calc(100vh-4rem)] w-full">
      <main className="flex-1 flex flex-col">{children}</main>
      <aside className="w-72 shrink-0 border-r bg-muted/20 overflow-y-auto">
        <ConversationList conversations={conversations} />
      </aside>
    </div>
  );
}
