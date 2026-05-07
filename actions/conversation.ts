'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { ctxKey } from '@/lib/redis/cache';
import type { MessageRole } from '@/generated/prisma/client';
import { isAIProvider, type AIProvider } from '@/lib/ai/provider';

async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error('Unauthorized');
  return userId;
}

export async function listConversations() {
  const userId = await requireUserId();
  return prisma.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, title: true, updatedAt: true },
  });
}

export async function createConversation(title?: string) {
  const userId = await requireUserId();
  const conv = await prisma.conversation.create({
    data: { userId, ...(title ? { title } : {}) },
    select: { id: true },
  });
  // No revalidate here: only caller is ChatIndex page render, which redirects
  // to /chat/[id]; the parent layout re-fetches listConversations on that
  // navigation. Calling revalidatePath during render is illegal in Next.js 16.
  return conv;
}

export async function getConversationProvider(
  conversationId: string,
): Promise<AIProvider | null> {
  const userId = await requireUserId();
  const conv = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    select: { provider: true },
  });
  if (!conv) throw new Error('Not found');
  return isAIProvider(conv.provider) ? conv.provider : null;
}

export async function getMessages(conversationId: string) {
  const userId = await requireUserId();
  const conv = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    select: { id: true },
  });
  if (!conv) throw new Error('Not found');

  // Cache-Aside read: Redis hit returns last 10; miss falls back to DB + backfill.
  const cached = await redis.get<MessageRecord[]>(ctxKey(conversationId));
  if (cached) return cached;

  const rows = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    take: 10,
    select: {
      id: true, role: true, content: true, toolCalls: true, createdAt: true,
    },
  });
  // TTL 30 min (1800s); write path in /api/chat deletes this key after persisting.
  await redis.set(ctxKey(conversationId), rows, { ex: 1800 });
  return rows;
}

/**
 * Switch the AI provider for a conversation.
 * Locked once any message exists, to keep the model consistent across context.
 */
export async function updateConversationProvider(
  conversationId: string,
  provider: AIProvider,
) {
  const userId = await requireUserId();
  if (!isAIProvider(provider)) throw new Error('Invalid provider');

  const conv = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    select: { id: true, _count: { select: { messages: true } } },
  });
  if (!conv) throw new Error('Not found');
  if (conv._count.messages > 0) throw new Error('Provider locked: conversation already started');

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { provider },
  });
  return { provider };
}

/**
 * Rename a conversation (manual override). Length-bounded to keep the
 * sidebar tidy; empty / whitespace-only input is rejected so users don't
 * accidentally erase the title.
 */
export async function renameConversation(conversationId: string, title: string) {
  const userId = await requireUserId();
  const trimmed = title.trim();
  if (trimmed.length === 0) throw new Error('Title cannot be empty');
  if (trimmed.length > 50) throw new Error('Title too long');

  const conv = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    select: { id: true },
  });
  if (!conv) throw new Error('Not found');

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { title: trimmed },
  });
  revalidatePath('/[locale]/dashboard/chat', 'layout');
  return { title: trimmed };
}

export async function deleteConversation(conversationId: string) {
  const userId = await requireUserId();
  const conv = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    select: { id: true },
  });
  if (!conv) throw new Error('Not found');
  await prisma.conversation.delete({ where: { id: conversationId } });
  await redis.del(ctxKey(conversationId));
  revalidatePath('/[locale]/dashboard/chat', 'page');
}

export type MessageRecord = {
  id: string;
  role: MessageRole;
  content: string;
  toolCalls: unknown;
  createdAt: Date;
};
