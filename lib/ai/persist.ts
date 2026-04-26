import 'server-only';
import prisma from '@/lib/prisma';
import { Prisma } from '@/generated/prisma/client';

export async function persistAssistantMessage(params: {
  conversationId: string;
  userId: string;
  userText: string;
  assistantText: string;
  toolCalls: Prisma.InputJsonValue | null;
  tokensIn?: number;
  tokensOut?: number;
}) {
  const {
    conversationId,
    userId,
    userText,
    assistantText,
    toolCalls,
    tokensIn,
    tokensOut,
  } = params;

  const ops: Prisma.PrismaPromise<unknown>[] = [];

  // Re-verify ownership atomically: bumps updatedAt only if {id, userId} matches.
  // count === 0 means conversation deleted/unauthorized between request start and onFinish.
  ops.push(
    prisma.conversation.updateMany({
      where: { id: conversationId, userId },
      data: { updatedAt: new Date() },
    }),
  );

  if (userText.trim()) {
    ops.push(
      prisma.message.create({
        data: { conversationId, role: 'USER', content: userText },
      }),
    );
  }

  ops.push(
    prisma.message.create({
      data: {
        conversationId,
        role: 'ASSISTANT',
        content: assistantText,
        toolCalls: toolCalls ?? Prisma.JsonNull,
        tokensIn,
        tokensOut,
      },
    }),
  );

  const results = await prisma.$transaction(ops);
  // First op is updateMany; if count is 0, the conversation was deleted/unauthorized.
  const updateResult = results[0] as { count: number };
  if (updateResult.count === 0) {
    throw new Error('Conversation not found or unauthorized');
  }
}
