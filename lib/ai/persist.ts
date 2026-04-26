import 'server-only';
import prisma from '@/lib/prisma';

export async function persistAssistantMessage(params: {
  conversationId: string;
  userText: string;
  assistantText: string;
  toolCalls: unknown;
  tokensIn?: number;
  tokensOut?: number;
}) {
  const {
    conversationId,
    userText,
    assistantText,
    toolCalls,
    tokensIn,
    tokensOut,
  } = params;
  await prisma.$transaction([
    prisma.message.create({
      data: { conversationId, role: 'USER', content: userText },
    }),
    prisma.message.create({
      data: {
        conversationId,
        role: 'ASSISTANT',
        content: assistantText,
        toolCalls: toolCalls as never,
        tokensIn,
        tokensOut,
      },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    }),
  ]);
}
