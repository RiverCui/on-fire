import { getMessages } from '@/actions/conversation';
import { ChatWindow } from '@/components/chat/chat-window';

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const initialMessages = await getMessages(conversationId);
  return (
    <ChatWindow
      conversationId={conversationId}
      initialMessages={initialMessages.map((m) => ({
        id: m.id,
        role: m.role === 'USER' ? 'user' : 'assistant',
        parts: [{ type: 'text', text: m.content }],
      }))}
    />
  );
}
