import { ChatWindow } from '@/components/chat/chat-window';

// Draft mode: render an empty chat without writing to the DB. The Conversation
// row is created lazily by /api/chat on the first message; the new id is
// streamed back via messageMetadata and the client swaps the URL in-place.
export default async function ChatIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <ChatWindow
      locale={locale}
      conversationId={null}
      initialProvider={null}
      initialMessages={[]}
    />
  );
}
