'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { ctxKey } from '@/lib/redis/cache';
import type { MessageRole } from '@/generated/prisma/client';

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
  revalidatePath('/[locale]/chat', 'page');
  return conv;
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

export async function deleteConversation(conversationId: string) {
  const userId = await requireUserId();
  const conv = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    select: { id: true },
  });
  if (!conv) throw new Error('Not found');
  await prisma.conversation.delete({ where: { id: conversationId } });
  await redis.del(ctxKey(conversationId));
  revalidatePath('/[locale]/chat', 'page');
}

export type MessageRecord = {
  id: string;
  role: MessageRole;
  content: string;
  toolCalls: unknown;
  createdAt: Date;
};
